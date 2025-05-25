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

Backup data::
docker exec mysql-container mysqldump -u root -pJuno@9091 --single-transaction --quick --lock-tables=false havidb > /media/exthd1/mysqlbackup/havidb$(date +%Y%m%d_%H%M%S).sql
restore data:
cat /media/exthd1/mysqlbackup/havidb20250331_200459.sql | docker exec -i mariadb-container mariadb -u root -pJuno@9091 havidb


docker run -d --name mariadb-container \
  -e MYSQL_ROOT_PASSWORD=Juno@9091 \
  -e MYSQL_DATABASE=havidb \
  -v /media/exthd1/mariadb:/var/lib/mysql \
  -p 3307:3306 \
  -d mariadb:latest

  CREATE USER 'havi'@'%' IDENTIFIED BY 'Juno@9091';
  GRANT ALL PRIVILEGES ON *.* TO 'havi'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

 GRANT ALL PRIVILEGES ON *.* TO 'havi'@'%' IDENTIFIED BY 'Juno@9091' WITH GRANT OPTION;


=======================================
MINIio

docker run -d \
  --name minio \
  -p 9090:9000 \
  -p 9001:9001 \
  -e "MINIO_ROOT_USER=havi" \
  -e "MINIO_ROOT_PASSWORD=Juno@9091" \
  -v /media/exthd1/miniio/data:/data \
  quay.io/minio/minio server /data --console-address ":9001"


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

Backup script
/media/exthd1/mysqlbackup/script/backup_script.sh

Start with the art style specification:
"Create a vintage 1950s children's book illustration with bold black outlines, flat colors without shading, and the characteristic hand-painted print aesthetic with slight registration misalignments typical of mid-century children's books."
Describe the scene composition clearly:
"The image should show [subject] positioned [location] within a [setting]. The background should include [specific elements]."
Provide exact character details:
"The main character should be a [species] with [specific physical traits] wearing [specific clothing items with colors]. Their expression should show [emotion]."
Specify colors explicitly:
"Use a palette of [specific colors listed] with [primary color] as the dominant tone."
Include text elements if needed:
"Include a speech bubble saying: '[exact text]' positioned near [character's] mouth."
Maintain consistency with previous illustrations:
"This character should match their appearance in previous illustrations: [list defining characteristics again]."
Describe lighting and mood:
"The scene should be lit by [light source] creating a [specific mood] atmosphere."
Keep cultural elements authentic:
"Include culturally accurate details such as [specific architectural elements, clothing styles, or environmental features]."
Avoid ambiguity with measurements:
"The character should be [specific size relationship] compared to [other element]."
End with the purpose of the illustration:
"This illustration should convey [specific emotion or story point] to the viewer."

docker pull jellyfin/jellyfin:latest


docker run -d \
  --name story-telling \
  -p 8080:8080 \
  -v /home/havi/app/logs:/app/logs \
  -e LOGGING_FILE_PATH=/app/logs \
  siva27neelam/story-telling:latest
