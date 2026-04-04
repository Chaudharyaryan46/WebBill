# 📋 Waiter Panel Design Specification (DineFlow v1.1)

![Waiter Panel UI Mockup](file:///C:/Users/hp/.gemini/antigravity/brain/8e42063c-dd9c-4994-a807-fdfb9669aa39/waiter_panel_ui_mockup_1775238392210.png)

> [!NOTE]
> This design prioritizes **Speed (KOT in <10s)**, **One-Handed Navigation**, and **High Error Tolerance** for high-volume environments (like Zomato/Swiggy/Toast POS).

---

## 🏗️ 1. Low-Fidelity Wireframe (Logical Layout)

```text
[   HEADER: "Table 12" | User: Rahul (Wait.)   ]
------------------------------------------------
[ CATEGORIES ] [ ITEMS GRID                   ]
[ (Left Col) ] [ (Right Scrollable Area)      ]
[ Drinks     ] [ [ Item 1: Cold Coffee  +]    ]
[ Starters   ] [ [ Item 2: Paneer Tikka +]    ]
[ Main       ] [ [ Item 3: Garlic Naan  +]    ]
[ Deserts    ] [ [ Item 4: Dal Makhani  +]    ]
[            ] [                              ]
------------------------------------------------
[ CURRENT ORDER (Collapsible Drawer/Fixed Bot) ]
[ 2x Cold Coffee | 1x Paneer Tikka | Total: 450]
[ [  - REDO terakhir -  ] [ SEND TO KITCHEN! ] ]
------------------------------------------------
```

---

## 🎨 2. High-Fidelity UI Description

### **General Aesthetics**
- **Theme**: Dark Mode by default (Reduces eye strain, saves battery, feels premium).
- **Colors**:
    - `Primary`: #FF5722 (Foodie Orange - Stimulates appetite/urgency).
    - `Success`: #4CAF50 (Vibrant Green - Free tables).
    - `Warning`: #FFD54F (Soft Amber - Occupied).
    - `Danger`: #EF5350 (Soft Red - Billing/Cancellation).
- **Typography**: Inter / Roboto (Heavy weights for labels, Sans-serif for readability on low-end screens).
- **Micro-tasks**: Buttons pulse slightly on tap (Haptic Feedback) to confirm action.

### **Key Component: The Table Grid**
- **Sizing**: 2x2 or 3x3 depending on screen width.
- **Status Pills**: A small dot or corner bar showing status.
- **Meta-info**: Number, session time (HH:mm), and a small "🔥" icon if they've been waiting for > 10 mins.

### **Key Component: "The Fast Menu"**
- **Zero Scroll**: Categories are 1-tap accessible. 
- **Big Tap**: Each item is a large card (no small checkboxes).
- **Haptic Add**: Tapping an item adds it instantly; the bottom cart bar "pings" visually.

---

## ⚛️ 3. Component Structure (React-based)

```jsx
// WaiterPanel.jsx (Main Container)
const WaiterPanel = () => {
  return (
    <Layout>
      <SideNav categories={categories} activeCategory={id} />
      <ItemsGrid items={filteredItems} onAddItem={handleFastAdd} />
      <BottomCart 
        currentItems={order.items} 
        onUpdateQty={handleQty} 
        onSendToKitchen={fireKOT} 
      />
      <UndoToast lastAction={lastAction} />
    </Layout>
  );
};

// Sub-components:
// - <TableCard />: Props: number, status, total, time
// - <CategoryItem />: Props: label, icon, isActive
// - <MenuItemCard />: Props: name, price, vegFlag, onAdd
// - <CartItem />: Props: name, qty, price, onDelete
```

---

## 🚦 4. UX Flows (The "10-Second Rule")

### **Flow A: Taking a New Order**
1.  **Waiters Dashboard**: Tap a "Green" table. (1s)
2.  **Category Picker**: The "Hot Selling" or "Starters" category is pre-selected. (0s)
3.  **Item Selection**: Tap "Manchow Soup", "Hakka Noodles". (2s)
4.  **KOT Dispatch**: Large "SEND TO KITCHEN" button at the bottom. (1s)
5.  **Confirmation**: Screen resets to Table Grid immediately. (1s)
    *   **Total Time**: ~5 seconds.

### **Flow B: Modifying an Order**
1.  Tap an "Amber" (Occupied) table. (1s)
2.  View existing items in a "Current List" summary. (1s)
3.  Tap a new item to add it (it joins the "Pending" section of the cart). (1s)
4.  Tap "Update Items" (only sends *new* ones to the kitchen). (1s)
    *   **Total Time**: ~4 seconds.

---

## 🚀 5. Performance & Error Prevention Rules

1.  **The "Undo" Buffer**: 
    - When an item is added, a 3-second floating toast appears: "Added Paneer Tikka... [UNDO]".
    - Tapping Undo removes it locally before it syncs to server.
2.  **Network Resilience (Optimistic UI)**:
    - When the "Send to Kitchen" button is tapped, move the UI to the "Success" state *immediately*. 
    - Handle the Socket.io event in the background. If it fails, show a "Sync Error - Retry" banner.
3.  **Low-End Device Compatibility**:
    - Avoid `box-shadow` on every card; use `border: 1px solid #333` instead.
    - No large background images; use CSS gradients.
    - Use `requestAnimationFrame` for any scroll-reveal animations.

---

## 🖇️ 6. Integration Guide (Socket.io Events)

To keep the UI real-time, the panel must listen for:
- `table:updated`: Refresh specific table color in the grid.
- `order:item-updated`: Update status icon (e.g., from *Cooking* to *Ready*).
- `whatsapp:receipt-sent`: Show confirmation if billing is done.
