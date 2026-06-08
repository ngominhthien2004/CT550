```mermaid

---

title: Sơ đồ Use Case - Quản trị viên (Admin)

---

---

config:

  useMaxWidth: true

  layoutControls:

    lineLength: 25

---

%% Actors

actor "Quản trị viên\n(Admin)" as Admin


%% Generalization: Admin kế thừa Member, Member kế thừa Guest

actor "Thành viên\n(Member)" as Member

actor "Khách vãng lai\n(Guest)" as Guest


Guest <|-- Member

Member <|-- Admin


%% === Administration ===

rectangle "Quản trị (Administration)" {

  usecase "UC47" as "Xem Dashboard tổng quan"

  usecase "UC48" as "Quản lý người dùng"

  usecase "UC49" as "Kiểm duyệt tác phẩm"

  usecase "UC50" as "Kiểm duyệt bình luận"

  usecase "UC51" as "Quản lý thẻ (tag)"

  usecase "UC52" as "Quản lý thanh toán"

  usecase "UC53" as "Xử lý báo cáo vi phạm"

  usecase "UC54" as "Cấu hình AI"

}


Admin --> UC47

Admin --> UC48

Admin --> UC49

Admin --> UC50

Admin --> UC51

Admin --> UC52

Admin --> UC53

Admin --> UC54


%% Quan hệ giữa các use case

UC48 ..> UC53 : <<include>>

UC49 ..> UC53 : <<include>>

UC50 ..> UC53 : <<include>>

```
