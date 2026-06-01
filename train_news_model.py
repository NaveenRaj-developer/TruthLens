import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import pickle
import os

os.makedirs("models", exist_ok=True)

# Load datasets
fake = pd.read_csv("datasets/Fake.csv")
true = pd.read_csv("datasets/True.csv")

fake["label"] = 0
true["label"] = 1
data = pd.concat([fake, true])

X = data["text"]
y = data["label"]

# Vectorizer
vectorizer = TfidfVectorizer(stop_words="english")
X_vec = vectorizer.fit_transform(X)

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X_vec, y, test_size=0.2, random_state=42
)

# Model
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# Accuracy
pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, pred))

# Save model and vectorizer
with open("models/news_model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("models/news_vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

print("✅ news_model.pkl & news_vectorizer.pkl created successfully!")