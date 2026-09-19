FROM node:22-slim AS web
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY apps/web ./apps/web
COPY content ./content
RUN npm run build
FROM python:3.11-slim
WORKDIR /app
COPY apps/api/requirements.lock.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/api ./apps/api
COPY content ./content
COPY --from=web /app/dist ./dist
CMD ["uvicorn","serve:app","--app-dir","apps/api","--host","0.0.0.0","--port","8000"]
