import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
import pickle
import os

os.makedirs("models", exist_ok=True)

data = pd.read_csv("datasets/phishing.csv")
X = data.drop("class", axis=1)
y = data["class"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=200, max_depth=20, random_state=42)
model.fit(X_train, y_train)

pred = model.predict(X_test)
print("URL Accuracy:", accuracy_score(y_test, pred))

with open("models/url_model.pkl", "wb") as f:
    pickle.dump(model, f)

# Optional dummy vectorizer for URLs
with open("models/url_vectorizer.pkl", "wb") as f:
    pickle.dump(None, f)

print("✅ url_model.pkl & url_vectorizer.pkl created successfully!")