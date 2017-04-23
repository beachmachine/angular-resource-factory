FROM node:7
MAINTAINER Andreas Stocker <andreas@stocker.co.it>

# Install system applications and libraries
RUN apt-get update && \
    apt-get install -y \
        git \
        cron \
        gettext \
        ca-certificates \
        fonts-dejavu-core \
        fonts-freefont-ttf \
        sudo \
        build-essential \
        libpq-dev \
        libmysqlclient-dev \
        libpng12-dev \
        libmcrypt-dev \
        libmcrypt4 \
        libcurl3-dev \
        libxml2-dev \
        libfreetype6 \
        libpng12-dev \
        libcairo2 \
        libpango1.0-0 \
        libgdk-pixbuf2.0-0 \
        libffi-dev \
        shared-mime-info \
        libfreetype6-dev \
        postgresql-client \
        mysql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install global node.js modules
RUN npm install --global \
        gulp-cli \
        grunt-cli \
        bower \
        karma \
        phantomjs

# Install entrypoint scripts
COPY docker-node-entrypoint /usr/local/bin/
RUN chmod a+x /usr/local/bin/docker-node-entrypoint

WORKDIR /app/src
ENTRYPOINT [ "/usr/local/bin/docker-node-entrypoint" ]
