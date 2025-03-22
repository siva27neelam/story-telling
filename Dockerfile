FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Add application JAR
COPY build/libs/story-telling-1.0.jar app.jar

# Expose the port your application runs on
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]