# # Use the official Node.js 18 image as the base
# FROM node:18
# WORKDIR /app
# RUN apt-get update && apt-get install -y iputils-ping
# COPY package.json .
# ARG NODE_ENV
# RUN if [ "$NODE_ENV" = "development"]; \
#         then npm install ; \
#         else npm install --only=production ; \
#         fi
# COPY . ./

# ENV PORT 5000

# EXPOSE 5000

# CMD ["npm", "run","dev"]
