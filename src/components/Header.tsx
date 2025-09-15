import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, FileText, Info } from 'lucide-react'

export default function Header() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Chat', icon: MessageCircle },
    { path: '/documents', label: 'Documents', icon: FileText },
    { path: '/about', label: 'About', icon: Info },
  ]

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Hospice Care Assistant</h1>
          </div>
          <nav className="flex space-x-4">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}