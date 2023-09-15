import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
	const googleAnalyticsScript = `
	    window.dataLayer = window.dataLayer || [];
	    function gtag(){dataLayer.push(arguments);}
	    gtag('js', new Date());
	    gtag('config', 'G-9N537GX3BR');
	  `;
	
	  const baiduAnalyticsScript = `
	    var _hmt = _hmt || [];
	    (function() {
	      var hm = document.createElement("script");
	      hm.src = "https://hm.baidu.com/hm.js?3a743f9ffe21e15c035a52ecfd7e3a97";
	      var s = document.getElementsByTagName("script")[0];
	      s.parentNode.insertBefore(hm, s);
	    })();
	  `;
  return (
    <html lang="en">
	  <head>
		 <title>AI Landing Page Generator - Free</title>
		 <meta name="description" content="Free AI Landing Page Generator. Create landing page easily with AI."/>
		 <meta name="viewport" content="width=device-width, initial-scale=1" />
		 <meta name="keywords" content="AI Landing Page Generator,Free,OnLine" />
		 <link rel="canonical" href="https://www.ailandingpagegenerator.com" />
		 <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
		 {/* Google Analytics Script */}
		 <script
		   async
		   src="https://www.googletagmanager.com/gtag/js?id=G-9N537GX3BR"
		 ></script>
		 <script dangerouslySetInnerHTML={{ __html: googleAnalyticsScript }} />
		 {/* Baidu Analytics Script */}
		 <script dangerouslySetInnerHTML={{ __html: baiduAnalyticsScript }} />
	  </head>
      <body>{children}</body>
    </html>
  );
}
