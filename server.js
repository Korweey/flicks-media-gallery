const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// AWS Configuration
const REGION = 'us-west-2';
const BUCKET_NAME = 'flicks-media-bucket-qr-8749';
const TABLE_NAME = 'Flicks';

const s3 = new S3Client({ region: REGION });
const ddbClient = new DynamoDBClient({ region: REGION });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

// HOME - List all flicks
app.get('/', async (req, res) => {
  try {
    const data = await dynamodb.send(new ScanCommand({ TableName: TABLE_NAME }));
    res.render('index', { flicks: data.Items });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching flicks: ' + err.message);
  }
});

// NEW FLICK FORM
app.get('/new', (req, res) => {
  res.render('new');
});

// ABOUT PAGE
app.get('/about', (req, res) => {
  res.render('about');
});

// CREATE FLICK - Handle upload
app.post('/flicks', upload.single('image'), async (req, res) => {
  const { title, description, tags } = req.body;
  const file = req.file;
  const eib = randomUUID();

  try {
    // Generate thumbnail using sharp
    const thumbnailBuffer = await sharp(file.path)
      .resize(100, 100)
      .toBuffer();

    // Upload original image to S3
    const imageKey = `images/${eib}-${file.originalname}`;
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: imageKey,
      Body: fs.readFileSync(file.path),
      ContentType: file.mimetype
    }));

    // Upload thumbnail to S3
    const thumbKey = `thumbnails/${eib}-thumb.jpg`;
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbKey,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg'
    }));

    // Record upload timestamp
    const createdAt = new Date().toISOString();

    // Save metadata to DynamoDB
    await dynamodb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        EIB: eib,
        title,
        description,
        tags: tags || '',
        imageKey,
        thumbKey,
        imageUrl: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${imageKey}`,
        thumbUrl: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${thumbKey}`,
        createdAt
      }
    }));

    // Clean up local temp file
    fs.unlinkSync(file.path);

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating flick: ' + err.message);
  }
});

// DELETE FLICK
app.post('/flicks/:eib/delete', async (req, res) => {
  const { eib } = req.params;
  try {
    // Get item first to find S3 keys
    const data = await dynamodb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { EIB: eib }
    }));

    const item = data.Item;

    // Delete from S3
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: item.imageKey }));
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: item.thumbKey }));

    // Delete from DynamoDB
    await dynamodb.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { EIB: eib }
    }));

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting flick: ' + err.message);
  }
});

app.listen(3000, () => {
  console.log('Flicks app running on port 3000');
});
