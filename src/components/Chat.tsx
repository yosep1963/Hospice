import { useState } from "react"

export default function Chat() {
  const [messages, setMessages] = useState([{ role: "bot", content: "무엇이 궁금하신가요?" }])
  const [input, setInput] = useState("")

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { role: "user", content: input }
    setMessages([...messages, userMsg])
    setInput("")

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ query: input }),
    })
    const data = await res.json()
    const botMsg = { role: "bot", content: data.answer || "답변을 찾지 못했습니다." }
    setMessages((prev) => [...prev, botMsg])
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="border p-3 rounded h-[60vh] overflow-y-auto bg-white shadow">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 text-sm ${msg.role === "user" ? "text-right" : "text-left text-blue-700"}`}>
            <div className="inline-block px-3 py-2 rounded bg-gray-100">{msg.content}</div>
          </div>
        ))}
      </div>
      <div className="flex mt-4 gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="질문을 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded">
          전송
        </button>
      </div>
    </div>
  )
}