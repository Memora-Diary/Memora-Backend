#!/bin/bash
set -euo pipefail

HOST=prod.bitnata.com

cd $PIPELINE_DIR

apt-get update -y
apt-get install -y python3-pip ssh-client
pip install --no-cache-dir awscli

aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
aws configure set region $AWS_REGION

echo $SSH_KEY | base64 -d > key.pem
chmod 400 key.pem # Deploy to docker swarm
ssh -o StrictHostKeyChecking=no -i key.pem ubuntu@$HOST "
  mkdir -p $APP_DIR
"
scp -o StrictHostKeyChecking=no -i key.pem stack.yml ubuntu@$HOST:$APP_DIR
ssh -o StrictHostKeyChecking=no -i key.pem ubuntu@$HOST "
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ECR_REGISTRY
  export IMAGE_TAG=$CI_COMMIT_TAG-$ENVIRONMENT
  docker stack deploy --with-registry-auth -c $APP_DIR/stack.yml $APP
"