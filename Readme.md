gradle clean build
docker login -u siva27neelam
docker build -t story-telling .
docker tag story-telling siva27neelam/story-telling
docker push siva27neelam/story-telling:latest
docker run -d -p 8080:8080 siva27neelam/story-telling -name story-telling
