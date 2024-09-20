# Start from a base image
FROM alpine:latest

ENV DOCKER_BUILDKIT=1
WORKDIR /app

# Install any necessary dependencies for your script here
# For example, you might need git, bash, aws-cli, etc.
RUN apk add --no-cache \
        git \
        bash \
        curl \
        python3 \
        py3-pip \
        util-linux \
        yarn \ 
        docker \
        openrc \
        openssh \
        openssh-client \
        aws-cli

# Add Docker to the openrc autostart
RUN rc-update add docker boot

ENTRYPOINT [ "/bin/sh", "-c"]
CMD ["/app/pipeline/deploy.sh"]