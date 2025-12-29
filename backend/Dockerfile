FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py auth.py ./

# Copy schema from parent directory
COPY ../schema.json /app/schema.json

# Create data directory
RUN mkdir -p /data/blobs /data/meta

ENV DATA_DIR=/data
ENV FLASK_APP=app.py

EXPOSE 5000

CMD ["python", "-m", "flask", "run", "--host=0.0.0.0"]
