# Currency Dashboard — Full Version

هذا مشروع Node.js + Express يقدم واجهة أمامية عصرية (Tailwind + Chart.js) وطبقة باك-إند بسيطة تعمل كـ proxy لطلبات API (exchangerate.host) مع كاش داخلي.

### متطلبات
- Node.js v18+ و npm

### التشغيل محلياً
```bash
# فك ضغط الحزمة (إن كانت مضغوطة)
cd full_currency_site
npm install
npm start
# افتح http://localhost:3000
```

### ملاحظات
- الخادم يقوم بجلب البيانات من `https://api.exchangerate.host`. لا تحتاج لمفتاح API.
- إذا رغبت بنشر الموقع كـ static على GitHub Pages: يمكنك تحويل الواجهة (public) إلى مشروع ثابت وترك النداءات مباشرة من المتصفح إلى `https://api.exchangerate.host` (بدون باك-إند)، لكن بعض قيود CORS قد تطبق.
- لإضافة أخبار حقيقية، أستطيع ربط endpoint خارجي (مثل NewsAPI) بعد تزويدي بمفتاح أو توجيه لاستخدام RSS.
