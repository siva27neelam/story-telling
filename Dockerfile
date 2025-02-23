FROM azul/zulu-openjdk:17-latest
VOLUME /tmp
COPY build/libs/story-telling-1.0.jar app.jar
EXPOSE 8080

ENTRYPOINT ["java","-jar","/app.jar"]

