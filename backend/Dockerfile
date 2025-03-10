# Step 1: Use a Node.js base image
FROM node:16-alpine

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install --production

# Step 5: Copy the rest of the application code
COPY . .

# Step 6: Expose the application port
EXPOSE 4000

# Step 7: Set the command to run the application
CMD ["npm", "start"]
