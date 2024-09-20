# Step 1: Use a Node.js base image
FROM node:18-alpine

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy the package.json and package-lock.json (if available)
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application code into the working directory
COPY . .

EXPOSE 3003


ENV PORT 3003

ENV HOSTNAME=0.0.0.0

# Step 7: Define the command to start the app
CMD [ "node", "index.js", "-p", "3003" ]