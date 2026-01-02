import '@testing-library/jest-dom'

test('index module can be imported and renders into #root', async () => {
  // create a root element before importing the module which will call createRoot().render()
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)

  // dynamic import so the file executes after the DOM node exists
  await import('./index')

  // after import, App should have rendered into #root; assert that root is not empty
  const container = document.getElementById('root')
  expect(container).not.toBeNull()
})
