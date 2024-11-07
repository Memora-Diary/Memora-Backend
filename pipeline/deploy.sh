#!/bin/bash
set -euo pipefail

# get secrets manager
# save a temporary copy of current .env file
export AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id --profile ${AWS_CREDENTIALS_PROFILE})
export AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key --profile ${AWS_CREDENTIALS_PROFILE})

cp .env .env.bak
aws secretsmanager get-secret-value --region $REGION --secret-id $DEPLOYMENT_TARGET-$APP-env --query SecretString --output text > .env

# Setup buildx
docker buildx create --name mybuilder --use
docker buildx install

# Authenticate to AWS ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR

# Build & Push docker image with increased verbosity

docker buildx build --provenance=false --platform linux/amd64,linux/arm64 -t $ECR/$DOCKER_REPO:$IMAGE_TAG --push --progress=plain .

# restore .env file
mv .env.bak .env

# # Deploy to docker swarm
ssh -o StrictHostKeyChecking=no -i /root/.ssh/key.pem $HOST "
  mkdir -p $APP_DIR
"
scp -o StrictHostKeyChecking=no -i /root/.ssh/key.pem pipeline/stack.yml $HOST:$APP_DIR
ssh -o StrictHostKeyChecking=no -i /root/.ssh/key.pem $HOST "
  aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR
  export IMAGE_TAG=$IMAGE_TAG
  docker stack deploy --with-registry-auth -c $APP_DIR/stack.yml $APP
"