gradle clean build
docker login -u siva27neelam
docker build -t story-telling .
docker tag story-telling siva27neelam/story-telling
docker push siva27neelam/story-telling:latest
docker run -d -p 8080:8080 siva27neelam/story-telling -name story-telling

A vintage 1950s  book illustration of a thirsty crow and pebbles
 fabble
drawn in classic cartoon style with bold outlines, flat colors,
and a hand-painted print aesthetic with a heading Thirsty Crow
"muted tones," "uncluttered composition," and "whimsical details,"
the prompt guides the AI to replicate the 1950s children's book style more accurately.

gradle clean build
docker login -u siva27neelam
docker build -t siva27neelam/story-telling:latest -t siva27neelam/story-telling:4.0.0 .
docker push siva27neelam/story-telling:latest
docker push siva27neelam/story-telling:4.0.0
docker push --all-tags siva27neelam/story-telling

Github actions to publish to docker hub now-
Cosmetic commit #1

Cloudflare tunnels for exposing local network to internet.
1. Loginto cloudflare
2. click on zero trust on the right
3. Click on networks, click on tunnels
4. Add a domain, add your domain(buy domain from godaddy or bigrock, Porkbun(sleepytales is here)
5. configure the nameservers
6. add tunnels
7. get the docker image and install in your local server
8. Now configure the host names and port
9. Use zoho to configure the email


