# Flicks Media Gallery

A cloud-native media management web application built with Node.js, Express, and AWS — Cloud Architecture Assignment, Humber Polytechnic (2026).

## Overview

Flicks lets users upload images with a title, description, and tags. Each upload is processed to generate a thumbnail, stored in Amazon S3, and recorded in Amazon DynamoDB. The gallery displays all flicks in a responsive card layout with delete functionality.

## Features

- Upload images with title, description, and tags
- Auto-generate 100×100 thumbnails using Sharp
- Store originals and thumbnails in Amazon S3
- Persist metadata (title, description, tags, timestamps) in Amazon DynamoDB
- Responsive 3-column card gallery
- Delete flicks (removes from S3 and DynamoDB)
- About page with project and tech stack details

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Templating | EJS |
| File Uploads | Multer |
| Image Processing | Sharp |
| Storage | Amazon S3 |
| Database | Amazon DynamoDB |
| AWS SDK | AWS SDK for JavaScript v3 |
| IDs | UUID v4 |

## AWS Resources

| Resource | Name |
|---|---|
| S3 Bucket | `flicks-media-bucket-qr-8749` |
| DynamoDB Table | `Flicks` (partition key: `EIB`) |
| Region | `us-west-2` |

## Project Structure

```
flicks/
├── server.js          # Express app — routes, S3, DynamoDB
├── views/
│   ├── index.ejs      # Gallery home page
│   ├── new.ejs        # Upload form
│   └── about.ejs      # About page
├── package.json
└── .gitignore
```

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Ensure AWS credentials are configured (IAM role on EC2, or `~/.aws/credentials`).

3. Start the app:
   ```bash
   npm start
   ```

4. Open `http://localhost:3000` in your browser.

---

**Developer:** Qawiyy Rabiu (N10038749)  
**Course:** Cloud Architecture — Humber Polytechnic, 2026
