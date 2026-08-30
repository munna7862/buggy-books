# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "BuggyBooks" [ref=e5] [cursor=pointer]:
      - /url: /
      - heading "BuggyBooks" [level=2] [ref=e6]
    - navigation [ref=e7]:
      - link "Catalog" [ref=e8] [cursor=pointer]:
        - /url: /
      - link "Login" [ref=e9] [cursor=pointer]:
        - /url: /login
      - link "Sign Up" [ref=e10] [cursor=pointer]:
        - /url: /register
      - button "Toggle notifications" [ref=e12] [cursor=pointer]:
        - text: 🔔
        - 'generic "Live Feed: Disconnected" [ref=e13]'
  - main [ref=e14]:
    - generic [ref=e15]:
      - heading "Book Catalog" [level=1] [ref=e16]
      - generic [ref=e17]:
        - textbox "Search books" [ref=e18]:
          - /placeholder: Search by title, author, or genre...
        - button "Search" [ref=e19] [cursor=pointer]
      - paragraph [ref=e20]: Loading books...
```