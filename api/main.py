from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain.tools.retriever import create_retriever_tool
from langchain_community.document_loaders import PDFPlumberLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores.faiss import FAISS

app = Flask(__name__)
CORS(app)  

# Define the upload folder
app.config['UPLOAD_FOLDER'] = 'uploads'  

load_dotenv()

loader = None
docs = None
splitter = None
splitDocs = None
embedding = None
vectorStore = None
retriever = None
model = None
prompt = None
retriever_tools = None
tools = None
agent = None
agentExecutor = None

def initialize(filepath):
    global loader, docs, splitter, splitDocs, embedding, vectorStore, retriever, model, prompt, retriever_tools, tools, agent, agentExecutor

    # Create Retriever
    loader = PDFPlumberLoader(filepath)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=200,
        chunk_overlap=20
    )
    splitDocs = splitter.split_documents(docs)

    embedding = OpenAIEmbeddings()
    vectorStore = FAISS.from_documents(docs, embedding=embedding)
    retriever = vectorStore.as_retriever(search_kwargs={"k": 3})

    model = ChatOpenAI(
        model='gpt-3.5-turbo-1106',
        temperature=0.7
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a friendly assistant called Max. You are being provided context from a PDF document. Answer questions based on it. You can ask for more information if needed. Give priority for information from the document."),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad")
    ])

    retriever_tools = create_retriever_tool(
        retriever,
        "pdf_search",
        "Use this tool when answering the questions."
    )
    tools = [retriever_tools]

    agent = create_openai_functions_agent(
        llm=model,
        prompt=prompt,
        tools=tools
    )

    agentExecutor = AgentExecutor(
        agent=agent,
        tools=tools
    )

@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    global loader, docs, splitter, splitDocs
    file = request.files['file']
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)  

        initialize(filepath)

        return jsonify({"message": "PDF uploaded successfully"})
    else:
        return jsonify({"error": "No file provided"}), 400  

@app.route('/ask-question', methods=['POST'])
def ask_question():
    data = request.get_json()
    question = data.get('question', '')
    chat_history = data.get('chat_history', [])

    if not question:
        return jsonify({"error": "No question provided"}), 400

    response = process_chat(question, chat_history)

    chat_history.append({"type": "human", "content": question})
    chat_history.append({"type": "ai", "content": response})

    return jsonify({"response": response, "chat_history": chat_history})

def process_chat(question, chat_history):
    response = agentExecutor.invoke({
        "input": question,
        "chat_history": chat_history
    })
    return response["output"]

if __name__ == '__main__':
    app.run(debug=True)