FROM python:3.12-slim

WORKDIR /app

# Tools needed for mounting and device detection
RUN apt-get update && apt-get install -y --no-install-recommends \
    util-linux \
    exfatprogs \
    fuse3 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scanner.py watcher.py ./

CMD ["python", "-u", "watcher.py"]
