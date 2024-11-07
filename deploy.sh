#!/bin/bash

usage() {
  echo "Usage: $0 [-t DEPLOYMENT_TARGET (required)] [-k IMAGE_TAG (optional)] [-m CREATE_NEW_TAG (optional)]  [-f AWS_CREDENTIALS_PROFILE]  [-p PRIVATE_KEY_PATH] [-h]" 1>&2
  exit 1
}


AWS_CONFIG=${AWS_CONFIG:-"${HOME}/.aws/config"}
AWS_CREDENTIALS=${AWS_CREDENTIALS:-"${HOME}/.aws/credentials"}

PRIVATE_KEY_PATH=${PRIVATE_KEY_PATH:-"$HOME/.ssh/WobreezeIreland.pem"}
AWS_CREDENTIALS_PROFILE=${AWS_CREDENTIALS_PROFILE:-default}
CREATE_NEW_IMAGE=${CREATE_NEW_IMAGE:-1}

while getopts ":t:k:m:f:p:c:h" o; do
  echo "o: $o - OPTARG: $OPTARG"
  case "${o}" in
    t)
      DEPLOYMENT_TARGET=${OPTARG}
      ;;
    k)
      IMAGE_TAG=${OPTARG}
      if ! git rev-parse "${IMAGE_TAG}" >/dev/null 2>&1; then
        echo "Error: The tag '${IMAGE_TAG}' does not exist in git repository."
        exit 1
      fi
      ;;
    m)
      CREATE_NEW_TAG=1
      ;;
    f)
      AWS_CREDENTIALS_PROFILE=${OPTARG}
      ;;
    p)
      PRIVATE_KEY_PATH=${OPTARG}
      ;;
    c)
      CREATE_NEW_IMAGE=${OPTARG}
      ;;
    h)
      usage
      ;;
    *)
      usage
      ;;
  esac
done
shift $((OPTIND-1)) 

if [ -z "${DEPLOYMENT_TARGET}" ]; then
    usage
fi

DEPLOYMENT_TARGET=${DEPLOYMENT_TARGET:-"stg"}
COMMIT_SHA=$(git log --pretty=format:'%h' -n 1)
REGION=eu-west-1
ECR=654654475781.dkr.ecr.eu-west-1.amazonaws.com
APP=memora
DOCKER_REPO=$APP-api
IMAGE_TAG=${IMAGE_TAG:-"$DEPLOYMENT_TARGET-$COMMIT_SHA"}
APP_DIR=/home/ubuntu/memora/



HOST=ubuntu@$DEPLOYMENT_TARGET.bitnata.com

# echo "Deploying to $DEPLOYMENT_TARGET with image tag $IMAGE_TAG"
# exit 0

if [ -n "${CREATE_NEW_TAG}" ]; then
    # Fetch the latest tag
    # sync tags from remote
    git fetch --tags

    LATEST_TAG=$(git tag -l | sort -V | tail -n 1)

    echo "Latest tag: $LATEST_TAG"
    # If there are no tags yet, we start with v1.0.0
    if [ -z "${LATEST_TAG}" ]; then
        LATEST_TAG="v1.0.0"
    fi

    # Split the tag into components
    IFS='.' read -ra ADDR <<< "${LATEST_TAG//v/}"

    # Increment the patch number by 1
    LAST_ELEMENT=${ADDR[-1]}
    ADDR[-1]=$((${LAST_ELEMENT} + 1))

    # Construct the new tag
    NEW_TAG="v$(IFS='.' ; echo "${ADDR[*]}")"

    # Set the new tag as the image tag
    IMAGE_TAG=$NEW_TAG

    # Create the new tag and push it to the repo
    git tag $NEW_TAG
    git push origin $NEW_TAG

    echo "Created new tag: $NEW_TAG"
fi



# Build the Docker image
docker build -t deploy-img . -f ./pipeline/Dockerfile

# Run the Docker container, passing the environment variables
docker run -it --rm --name deploy_$APP \
        -e DEPLOYMENT_TARGET=${DEPLOYMENT_TARGET} \
        -e AWS_CREDENTIALS_PROFILE=${AWS_CREDENTIALS_PROFILE} \
        -e AWS_CONFIG=${AWS_CONFIG} \
        -e REGION=${REGION} \
        -e ECR=${ECR} \
        -e APP=${APP} \
        -e DOCKER_REPO=${DOCKER_REPO} \
        -e IMAGE_TAG=${IMAGE_TAG} \
        -e HOST=${HOST} \
        -e APP_DIR=${APP_DIR} \
        -v ${PWD}:/app \
        -v ${AWS_CONFIG}:/root/.aws/config:ro \
        -v ${AWS_CREDENTIALS}:/root/.aws/credentials:ro \
        -v ${PRIVATE_KEY_PATH}:/root/.ssh/key.pem:ro \
        -v /var/run/docker.sock:/var/run/docker.sock \
        --network="host" \
        deploy-img
