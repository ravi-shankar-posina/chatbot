import React, { useState } from "react";

const PdfChatbot = () => {
  const [fileInputDisabled, setFileInputDisabled] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setFileInputDisabled(event.target.files.length === 0);
  };

  const askQuestion = () => {
    const questionValue = question.trim();
    if (questionValue === "") {
      alert("Please enter a question");
      return;
    }

    fetch(process.env.REACT_APP_ASK_QUESTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: questionValue, chat_history: chatHistory }),
    })
      .then((response) => response.json())
      .then((data) => {
        const response = data.response;
        const updatedChatHistory = [
          ...chatHistory,
          { type: "human", message: questionValue },
          { type: "bot", message: response },
        ];
        setChatHistory(updatedChatHistory);
        setQuestion("");
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred while sending the message");
      });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      askQuestion();
    }
  };

  const handleFileUpload = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    setLoading(true); // Set loading to true when file upload starts

    fetch(process.env.REACT_APP_UPLOAD_PDF_URL, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        if (data.message === "PDF uploaded successfully") {
          setFileInputDisabled(false);
        }
        setLoading(false); // Set loading to false when file upload completes
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred while uploading the PDF");
        setLoading(false); // Set loading to false if an error occurs
      });
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        margin: 0,
        padding: 0,
        backgroundColor: "#222",
        color: "#fff",
        position: "relative",
        minHeight: "100vh", // Ensure the div covers the whole viewport
      }}
    >
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div className="spinner" style={{ border: "4px solid rgba(0, 0, 0, 0.1)", borderLeftColor: "#fff", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }} />
        </div>
      )}

      <div
        style={{
          maxWidth: "600px",
          margin: "20px auto",
          padding: "20px",
          backgroundColor: "#333",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
        }}
      >
        <h1>PDF Chatbot</h1>

        <h2>Upload PDF</h2>
        <form
          id="uploadForm"
          encType="multipart/form-data"
          onSubmit={handleFileUpload}
          style={{ display: "flex" }}
        >
          <input
            type="file"
            name="file"
            id="fileInput"
            onChange={handleFileChange}
            style={{
              backgroundColor: "#444",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: "5px",
              padding: "10px",
              marginRight: "10px",
              width: "calc(100% - 70px)",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              backgroundColor: "#008cba",
              color: "white",
              cursor: "pointer",
            }}
          >
            Upload
          </button>
        </form>

        <hr />
        <div
          id="chatHistory"
          className="chat-history"
          style={{
            height: "450px",
            overflowY: "scroll",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {chatHistory.map((item, index) => (
            <div
              key={index}
              className={`message-container ${item.type}`}
              style={{
                display: "flex",
                justifyContent: item.type === "human" ? "flex-end" : "flex-start",
                marginBottom: "10px",
              }}
            >
              <div
                className="message"
                style={{
                  display: "inline-block",
                  maxWidth: "70%",
                  padding: "10px 15px",
                  borderRadius: "15px",
                  marginBottom: "5px",
                  backgroundColor: item.type === "human" ? "#4caf50" : "#008cba",
                  color: "white",
                }}
              >
                {item.message}
              </div>
            </div>
          ))}
        </div>

        <hr />

        <h2>Ask Question</h2>
        <div className="message-container">
          <input
            type="text"
            id="questionInput"
            placeholder="Enter your question"
            disabled={fileInputDisabled}
            onKeyDown={handleKeyDown}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{
              width: "calc(100% - 70px)",
              padding: "10px",
              border: "1px solid #555",
              borderRadius: "5px",
              marginRight: "10px",
              backgroundColor: "#444",
              color: "#fff",
            }}
          />
          <button
            onClick={askQuestion}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              backgroundColor: "#008cba",
              color: "white",
              cursor: "pointer",
            }}
          >
            Ask
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default PdfChatbot;