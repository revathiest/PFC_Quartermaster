# Troubleshooting Automatic TLS

This project uses **Greenlock** to automatically obtain certificates from Let's Encrypt. During the "ACME" verification process, Let's Encrypt checks that your domain serves a challenge file over **HTTP**. If this file cannot be reached, the challenge moves from `pending` to `invalid`, and certificate issuance fails.

Common causes include:

- Port **80** blocked by a firewall or already in use
- Domain DNS records pointing to the wrong IP
- A redirect or proxy preventing access to `/.well-known/acme-challenge/*`

Make sure your site is reachable on port 80 and that the challenge path returns the value that Greenlock provides. You can test by visiting:

```
http://<your-domain>/.well-known/acme-challenge/test
```

You should see the test content without a redirect. Once the challenge succeeds, Let's Encrypt will issue the certificate and Greenlock will start the HTTPS server automatically.
