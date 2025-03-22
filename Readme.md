gradle clean build
docker login -u siva27neelam
docker build -t story-telling .
docker tag story-telling siva27neelam/story-telling
docker push siva27neelam/story-telling:latest
docker run -d -p 8080:8080 siva27neelam/story-telling -name story-telling

A vintage 1950s children’s book illustration of a thirsty crow and pebbles
 fabble
drawn in classic cartoon style with bold outlines, flat colors,
and a hand-painted print aesthetic with a heading Thirsty Crow

gradle clean build
docker login -u siva27neelam
docker build -t siva27neelam/story-telling:latest -t siva27neelam/story-telling:3.0.0 .
docker push siva27neelam/story-telling:latest
docker push siva27neelam/story-telling:3.0.0
docker push --all-tags siva27neelam/story-telling


