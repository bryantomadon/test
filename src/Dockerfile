# Image officielle Nginx, variante « non privilégiée » : le serveur ne tourne PAS en root
FROM nginxinc/nginx-unprivileged:stable-alpine

# On copie le site dans le dossier que Nginx sert par défaut
COPY src/ /usr/share/nginx/html/

# Un utilisateur non-root ne peut pas écouter sur le port 80 : cette image écoute sur 8080
EXPOSE 8080