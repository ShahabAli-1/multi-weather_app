# Use an official Node.js image for building the React app
FROM node:20-alpine as build

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Use Nginx to serve the frontend
FROM nginx:alpine

# Copy the build folder from the previous stage
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# Expose port 80 for the React app
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
