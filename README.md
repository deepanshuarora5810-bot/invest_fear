# 📈 Invest Fear — Fear & Greed Index Web App

A full-stack web application that tracks and visualizes the **Fear & Greed Index** for investment markets — helping investors understand current market sentiment and make more informed decisions.

---

## 🧠 What is the Fear & Greed Index?

The Fear & Greed Index is a sentiment indicator that measures whether the market is driven by **fear** (potential buying opportunity) or **greed** (potential market correction). The index ranges from:

| Score | Sentiment       |
|-------|-----------------|
| 0–24  | Extreme Fear    |
| 25–44 | Fear            |
| 45–55 | Neutral         |
| 56–74 | Greed           |
| 75–100| Extreme Greed   |

---

## 🗂️ Project Structure

```
invest_fear/
├── backend/         # Python backend (API / data processing)
├── frontent/        # JavaScript + HTML frontend
├── requirments/     # Project dependencies
└── .gitignore
```

---

## 🛠️ Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Frontend | JavaScript, HTML  |
| Backend  | Python            |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js (for frontend dependencies, if applicable)

### 1. Clone the Repository

```bash
git clone https://github.com/deepanshuarora5810-bot/invest_fear.git
cd invest_fear
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r ../requirments/requirements.txt
```

### 3. Run the Backend

```bash
python app.py
```

### 4. Open the Frontend

Navigate to the `frontent/` directory and open `index.html` in your browser, or serve it with a local server:

```bash
cd frontent
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

---

## ✨ Features

- 📊 Live Fear & Greed Index visualization
- 📅 Historical index data display
- 🖥️ Clean and responsive frontend UI
- ⚙️ Python-powered backend for data fetching and processing

---

## ⚠️ Disclaimer

This project is for **educational and informational purposes only**. It does not constitute financial advice. Do not make investment decisions solely based on this tool.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 👤 Author

**Deepanshu Arora**
- GitHub: [@deepanshuarora5810-bot](https://github.com/deepanshuarora5810-bot)

---

## 📄 License

This project is open source. Feel free to use and modify it for your own purposes.
