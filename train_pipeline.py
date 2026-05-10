import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

def main():
    print("Initializing Fake News Training Pipeline...")
    
    # 1. Define paths
    train_fake_path = "Data/Train/Fake_train_labeled.csv"
    train_true_path = "Data/Train/True_train_labeled.csv"
    test_fake_path = "Data/Test/Fake_test_labeled.csv"
    test_true_path = "Data/Test/True_test_labeled.csv"
    results_dir = "results"
    
    # Ensure results directory exists
    os.makedirs(results_dir, exist_ok=True)
    
    # 2. Load Data
    print("Loading data...")
    # Read CSVs
    df_train_fake = pd.read_csv(train_fake_path)
    df_train_true = pd.read_csv(train_true_path)
    df_test_fake = pd.read_csv(test_fake_path)
    df_test_true = pd.read_csv(test_true_path)
    
    # Ensure correct labels per user instructions (Fake=0, True=1)
    # The files already have a 'label' column but let's enforce it to be absolutely sure.
    df_train_fake['label'] = 0
    df_test_fake['label'] = 0
    df_train_true['label'] = 1
    df_test_true['label'] = 1
    
    # 3. Merge train and test locally without reshuffling across train/test boundary
    print("Merging datasets...")
    train_data = pd.concat([df_train_fake, df_train_true], ignore_index=True)
    test_data = pd.concat([df_test_fake, df_test_true], ignore_index=True)
    
    # Shuffle train and test internally so the model doesn't see all fakes then all trues
    # Note: user said "Do NOT reshuffle or re-split the data again in code."
    # Wait, the user specifically said "Do NOT reshuffle or re-split the data again in code."
    # To strictly follow "Do NOT reshuffle", I will NOT shuffle the merged dataframe.
    # However, LogisticRegression in sklearn uses solvers (like lbfgs or liblinear) that handle non-shuffled data fine because they optimize over the whole batch. 
    # But for safety in feature extraction and just to make the evaluation fair, I won't shuffle to strictly follow "Do NOT reshuffle".
    
    # Drop rows with missing text
    train_data = train_data.dropna(subset=['text'])
    test_data = test_data.dropna(subset=['text'])
    
    X_train = train_data['text']
    y_train = train_data['label']
    
    X_test = test_data['text']
    y_test = test_data['label']
    
    # 4. Feature Extraction (TF-IDF)
    print("Extracting TF-IDF features...")
    # Matching the previous TS config (max_features=5000, stop_words, min_df=5)
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000, min_df=5, max_df=0.7)
    
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    # 5. Model Training
    print("Training Logistic Regression model...")
    # C=0.5 corresponds to the lambda=2.0 L2 regularization we had in TypeScript
    model = LogisticRegression(C=0.5, max_iter=1000, random_state=42)
    model.fit(X_train_vec, y_train)
    
    # 6. Evaluation
    print("Evaluating model...")
    y_pred = model.predict(X_test_vec)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)
    
    # 7. Print final metrics to terminal
    print("\n" + "="*50)
    print("FINAL EVALUATION METRICS")
    print("="*50)
    print(f"Accuracy:  {acc*100:.2f}%")
    print(f"Precision: {prec*100:.2f}%")
    print(f"Recall:    {rec*100:.2f}%")
    print(f"F1-Score:  {f1*100:.2f}%")
    print("="*50)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Fake (0)", "True (1)"]))
    
    # 8. Generate and save clean, report-ready graphs
    print("Generating report-ready charts...")
    sns.set_theme(style="whitegrid", palette="muted")
    
    # Chart 1: Dataset Distribution (Train vs Test)
    plt.figure(figsize=(10, 6))
    dist_data = pd.DataFrame({
        'Dataset': ['Train', 'Train', 'Test', 'Test'],
        'Label': ['Fake (0)', 'True (1)', 'Fake (0)', 'True (1)'],
        'Count': [len(df_train_fake), len(df_train_true), len(df_test_fake), len(df_test_true)]
    })
    sns.barplot(data=dist_data, x='Dataset', y='Count', hue='Label', palette=['#e74c3c', '#2ecc71'])
    plt.title('Dataset Distribution (Fake vs True)', fontsize=16, pad=15)
    plt.ylabel('Number of Articles', fontsize=12)
    plt.xlabel('Dataset Split', fontsize=12)
    plt.legend(title='News Type')
    plt.tight_layout()
    plt.savefig(os.path.join(results_dir, 'dataset_distribution.png'), dpi=300)
    plt.close()
    
    # Chart 2: Accuracy Chart (Gauge/Bar style for single value)
    plt.figure(figsize=(6, 8))
    plt.bar(['Accuracy'], [acc], color='#3498db', width=0.4)
    plt.ylim(0, 1)
    plt.title('Overall Model Accuracy', fontsize=16, pad=15)
    plt.ylabel('Score', fontsize=12)
    plt.text(0, acc + 0.02, f"{acc*100:.2f}%", ha='center', va='bottom', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(results_dir, 'accuracy_chart.png'), dpi=300)
    plt.close()
    
    # Chart 3: Precision / Recall / F1 Comparison
    plt.figure(figsize=(8, 6))
    metrics_df = pd.DataFrame({
        'Metric': ['Precision', 'Recall', 'F1-Score'],
        'Score': [prec, rec, f1]
    })
    sns.barplot(data=metrics_df, x='Metric', y='Score', palette='viridis')
    plt.ylim(0, 1.1)
    plt.title('Performance Metrics Comparison', fontsize=16, pad=15)
    for index, row in metrics_df.iterrows():
        plt.text(index, row['Score'] + 0.02, f"{row['Score']*100:.2f}%", color='black', ha='center', fontsize=12, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(results_dir, 'metrics_comparison.png'), dpi=300)
    plt.close()
    
    # Chart 4: Confusion Matrix Heatmap
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=['Fake (0)', 'True (1)'], 
                yticklabels=['Fake (0)', 'True (1)'],
                annot_kws={"size": 16})
    plt.title('Confusion Matrix', fontsize=16, pad=15)
    plt.ylabel('Actual Label', fontsize=12)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(results_dir, 'confusion_matrix.png'), dpi=300)
    plt.close()
    
    print(f"Pipeline complete! All charts have been saved to the '{results_dir}' directory.")

if __name__ == "__main__":
    main()
