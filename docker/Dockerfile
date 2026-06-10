
FROM zenika/alpine-chrome:latest

USER root

EXPOSE 9222

ENTRYPOINT ["chromium-browser", \
    "--headless", \
    "--no-sandbox", \
    "--disable-setuid-sandbox", \
    "--disable-dev-shm-usage", \
    "--disable-gpu", \
    "--remote-debugging-address=0.0.0.0", \
    "--remote-debugging-port=9222", \
    "--user-data-dir=/tmp/chromium", \
    "--window-size=1280,720", \
    "--hide-scrollbars", \
    "about:blank"]

