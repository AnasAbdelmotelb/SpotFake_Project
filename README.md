# SpotFake – Fake News and Deepfake Detection System

## Overview

SpotFake is an Artificial Intelligence-based fake news detection system developed as part of the 6FTC2089 Artificial Intelligence Project module.

The system analyses textual news content and image-based news posts to classify information as either real or fake using Machine Learning and Optical Character Recognition (OCR) technologies.

The project combines:

* Natural Language Processing (NLP)
* TF-IDF Vectorization
* Logistic Regression Classification
* OCR using Tesseract.js
* React Frontend Interface

---

# Features

* Fake news classification using Machine Learning
* Text preprocessing and cleaning
* TF-IDF feature extraction
* Logistic Regression prediction model
* OCR text extraction from uploaded images
* Web-based frontend interface
* Real/Fake prediction confidence display
* Performance evaluation using graphs and metrics

---

# Technologies Used

## Frontend

* React.js
* TypeScript
* Tailwind CSS

## Machine Learning

* Python
* Scikit-learn
* Pandas
* NumPy

## OCR

* Tesseract.js

## Data Visualization

* Matplotlib
* Seaborn

---

# Machine Learning Workflow

The system follows these main stages:

1. Dataset Collection
2. Text Cleaning and Preprocessing
3. TF-IDF Feature Extraction
4. Logistic Regression Model Training
5. OCR Text Extraction
6. Prediction and Classification
7. Result Visualization

---

# Dataset

The dataset contains labelled fake and real news articles used for supervised machine learning training.

Dataset split:

* 80% Training Data
* 20% Testing Data

---

# Performance Results

The developed model achieved:

* Accuracy: 98.55%
* Precision: 98.35%
* Recall: 98.62%
* F1-Score: 98.48%

---

# OCR Integration

The project integrates Tesseract.js to extract textual content from uploaded images before performing fake news analysis.

This allows the system to analyse:

* Screenshots
* Social media posts
* Image-based news content

---

## Navigate to Project Folder

```bash
cd SpotFake_Project
```

## Install Frontend Dependencies

```bash
npm install
```

## Run Frontend

```bash
npm run dev
```

## Run Machine Learning Scripts

```bash
python train_pipeline.py
```

---

# Project Structure

```bash
SpotFake_Project/
│
├── Data/
│   ├── Train/
│   └── Test/
│
├── src/
│   ├── components/
│   ├── pages/
│   └── utils/
│
├── results/
├── train_pipeline.py
├── package.json
└── README.md
```

---

# Screenshots

The repository includes:

* OCR upload interface
* Prediction result interface
* Accuracy graphs
* Confusion matrix
* System workflow diagrams

---

# Author

Anas Abdelmotelb Mansour

BSc Hons Computer Science (Artificial Intelligence)



---

# Academic Use

This project was developed for educational and academic purposes as part of the final year Artificial Intelligence Project module.
