import Chat from "../components/Chat"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <h1 className="text-xl font-bold text-center py-4">🏥 호스피스 연명의료 챗봇</h1>
      <Chat />
    </main>
  )
}