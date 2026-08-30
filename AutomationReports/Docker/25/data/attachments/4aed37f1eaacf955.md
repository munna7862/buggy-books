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
        - 'generic "Live Feed: Connected" [ref=e13]'
  - main [ref=e14]:
    - generic [ref=e16]:
      - generic [ref=e17]:
        - heading "Welcome Back" [level=1] [ref=e18]
        - paragraph [ref=e19]: Sign in to continue to BuggyBooks.
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]: Username
          - textbox "Username" [ref=e23]:
            - /placeholder: Enter your username
            - text: admin
        - generic [ref=e24]:
          - generic [ref=e25]: Password
          - textbox "Password" [ref=e26]:
            - /placeholder: ••••••••
            - text: password123
        - button "Authenticating..." [disabled] [ref=e27]: Authenticating...
      - generic [ref=e29]:
        - text: Don't have an account?
        - link "Sign up here" [ref=e30] [cursor=pointer]:
          - /url: /register
```