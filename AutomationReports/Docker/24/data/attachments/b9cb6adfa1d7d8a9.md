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
      - link "Cart" [active] [ref=e9] [cursor=pointer]:
        - /url: /cart
      - link "Checkout" [ref=e10] [cursor=pointer]:
        - /url: /checkout
      - link "Profile" [ref=e11] [cursor=pointer]:
        - /url: /profile
      - button "Logout" [ref=e12] [cursor=pointer]
      - button "Toggle notifications" [ref=e14] [cursor=pointer]:
        - text: 🔔
        - 'generic "Live Feed: Connected" [ref=e15]'
  - main [ref=e16]:
    - generic [ref=e17]:
      - heading "Your Cart" [level=1] [ref=e18]
      - paragraph [ref=e19]: Your cart is empty.
```