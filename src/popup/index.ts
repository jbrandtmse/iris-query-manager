import './index.css'

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app')
  if (!appElement) {
    console.error('Popup: #app element not found')
    return
  }

  // Create the main element
  const mainElement = document.createElement('main')

  // Create the title element
  const h3Element = document.createElement('h3')
  h3Element.textContent = 'IRIS Query Manager'

  // Create placeholder content (will be replaced in Story 2.x with query list UI)
  const placeholderElement = document.createElement('p')
  placeholderElement.textContent = 'Query manager UI coming soon...'
  placeholderElement.className = 'placeholder'

  // Append all elements to the main element
  mainElement.appendChild(h3Element)
  mainElement.appendChild(placeholderElement)

  // Append the main element to the page
  appElement.appendChild(mainElement)
})
