FROM nginxinc/nginx-unprivileged:stable-alpine

# Installer les correctifs de sécurité publiés depuis la construction de l'image de base.
# Il faut être root pour installer des paquets…
USER root
RUN apk upgrade --no-cache
# … puis on redevient immédiatement l'utilisateur non privilégié de l'image (UID 101)
USER 101

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY src/ /usr/share/nginx/html/
EXPOSE 8080