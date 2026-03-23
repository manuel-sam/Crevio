import { BrowserRouter as Router, Routes, Route, Link, useParams } from "react-router-dom";
import { useState } from "react";

/* =========================================
   CORE LOGIC & HELPERS (TRUST ENGINE)
========================================= */

// Dynamically check if provider meets verification standards
const checkVerification = (p) => {
  return Boolean(p.whatsapp && p.bio && p.reviewList && p.reviewList.length >= 1);
};

// Calculate Crevio Reputation Score (Mock Algorithm out of 100)
const calculateCrevioScore = (p) => {
  let score = 0;
  // Factor 1: Rating (Max 50 points)
  score += (parseFloat(p.rating || 0) / 5) * 50;
  // Factor 2: Reviews (Max 30 points - capped at 50 reviews for max points)
  score += Math.min(p.reviews || 0, 50) * 0.6;
  // Factor 3: Profile Completeness (Max 20 points)
  if (p.bio && p.whatsapp) score += 10;
  if (p.portfolio && p.portfolio.length > 0) score += 10;
  
  return Math.round(score);
};

/* =========================================
   MOCK DATA 
========================================= */
const providersData = [
  {
    id: "sola-tailor",
    name: "Sola Tailor",
    service: "Tailor",
    rating: "4.9",
    reviews: 102,
    location: "Lagos, Nigeria",
    whatsapp: "2348033333333",
    bio: "Expert tailor with over 10 years of experience. I specialize in premium finishing for bespoke traditional and modern wear.",
    portfolio: [
      "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&q=80&w=400"
    ],
    reviewList: [
      { id: 1, name: "Chisom O.", rating: 5, text: "Absolutely loved the dresses! Premium finishing." },
      { id: 2, name: "David K.", rating: 4, text: "Great finishing and attention to detail." }
    ]
  },
  {
    id: "mike-electrician",
    name: "Mike Electrician",
    service: "Electrician",
    rating: "4.9",
    reviews: 87,
    location: "Ibadan, Nigeria",
    whatsapp: "2348011111111",
    bio: "Reliable electrical expert for homes and offices. I guarantee safety and efficiency.",
    portfolio: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=400"
    ],
    reviewList: [
      { id: 1, name: "Tunde A.", rating: 5, text: "Fixed the power surge issue safely." }
    ]
  },
  {
    id: "ade-plumber",
    name: "Ade Plumber",
    service: "Plumber",
    rating: "4.7",
    reviews: 65,
    location: "Abuja, Nigeria",
    whatsapp: "2348022222222",
    bio: "Professional plumbing services. I handle pipe fixing, water system installations, and emergency leak repairs.",
    portfolio: [
      "https://images.unsplash.com/photo-1607472586893-edb57cbceb42?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400"
    ],
    reviewList: [
      { id: 1, name: "Ngozi M.", rating: 5, text: "Very professional. Cleaned up nicely." }
    ]
  },
  // NEW: Added an unverified provider to test the Trust Engine logic
  {
    id: "chinedu-painter",
    name: "Chinedu Painter",
    service: "Painter",
    rating: "0.0",
    reviews: 0,
    location: "Lagos, Nigeria",
    whatsapp: "2348044444444",
    bio: "New on Crevio! Ready to paint your houses beautifully.",
    portfolio: [],
    reviewList: []
  }
];

const feedMockData = [
  {
    id: 1,
    authorName: "Sola Tailor",
    authorId: "sola-tailor",
    image: "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&q=80&w=600",
    caption: "Just finished this beautiful bespoke wedding dress! 💍✨ #Tailor #CrevioArtisan",
    likes: 124,
    comments: []
  }
];

/* =========================================
   REUSABLE UI COMPONENTS
========================================= */
const StarIcon = () => <span className="text-[#F59E0B]">★</span>;

const BadgeCheckIcon = () => (
  <svg className="w-5 h-5 text-[#2563EB] inline-block ml-1" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const CrevioScoreBadge = ({ score }) => {
  // Color coding based on trust level
  const bg = score >= 80 ? "bg-green-100 text-green-800 border-green-200" : score >= 50 ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold shadow-sm ${bg}`}>
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" /></svg>
      Crevio Score: {score}/100
    </div>
  );
};

// Extracted Provider Card (Now with dynamic Verification and Score)
const ProviderCard = ({ p }) => {
  const isVerified = checkVerification(p);
  const score = calculateCrevioScore(p);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition duration-300 relative">
      <div className="h-28 bg-gradient-to-r from-blue-50 to-orange-50 relative">
        <div className="absolute top-3 right-3">
          <CrevioScoreBadge score={score} />
        </div>
      </div>
      <div className="p-6 relative">
        <div className="w-16 h-16 bg-[#2563EB] text-white rounded-full flex items-center justify-center text-xl font-bold absolute -top-8 border-4 border-white shadow-sm">
          {p.name.charAt(0)}
        </div>
        <h3 className="font-bold text-lg mt-4 flex items-center text-[#111827]">
          {p.name} {isVerified && <BadgeCheckIcon />}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
          <span className="flex items-center font-medium text-gray-900"><StarIcon /> {p.rating}</span>
          <span>({p.reviews} reviews)</span>
          <span>•</span>
          <span>{p.location.split(',')[0]}</span>
        </div>
        <p className="text-gray-600 mt-4 text-sm line-clamp-2">{p.bio}</p>
        <Link to={`/provider/${p.id}`} className="block mt-6">
          <button className="w-full bg-[#F9FAFB] border border-gray-200 text-[#111827] font-medium py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition">
            View Profile
          </button>
        </Link>
      </div>
    </div>
  );
};

/* =========================================
   PAGES & VIEWS
========================================= */

/* --- NAVBAR --- */
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 py-4 bg-white shadow-sm border-b border-gray-100">
      <Link to="/" className="text-2xl font-bold text-[#2563EB] tracking-tight">Crevio.</Link>
      <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
        <Link to="/" className="hover:text-[#2563EB] transition">Home</Link>
        <Link to="/services" className="hover:text-[#2563EB] transition">Services</Link>
        <Link to="/feed" className="hover:text-[#2563EB] transition">Feed</Link>
        <Link to="/about" className="hover:text-[#2563EB] transition">About</Link>
      </div>
      <Link to="/request">
        <button className="bg-[#F59E0B] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-orange-600 hover:scale-105 transition duration-200">
          Post a Job
        </button>
      </Link>
    </nav>
  );
}

/* --- HOME --- */
function Home() {
  // Logic for "Top Rated in Your Area" (Simulating Lagos Location Context)
  const localProviders = providersData
    .filter(p => p.location.includes("Lagos"))
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    .slice(0, 3); // Take top 3

  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-20 text-[#111827]">
      {/* Hero */}
      <div className="text-center py-20 px-4 max-w-4xl mx-auto">
        <div className="inline-block bg-blue-50 text-[#2563EB] font-semibold px-4 py-1.5 rounded-full text-sm mb-6 border border-blue-100">
          The Trust Layer for Informal Services
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Find Skilled People <br className="hidden md:block" />
          <span className="text-[#2563EB]">You Can Trust.</span>
        </h1>
        <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
          Crevio is your verified marketplace for finding reliable artisans and professionals near you. Real reviews, verified identities, real work.
        </p>
        <div className="mt-10 max-w-xl mx-auto bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex items-center">
          <input placeholder="What service do you need? (e.g., Plumber)" className="w-full p-3 bg-transparent outline-none ml-2 text-gray-700 font-medium" />
          <Link to="/services"><button className="bg-[#2563EB] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition">Search</button></Link>
        </div>
      </div>

      {/* Trust Stats */}
      <div className="flex flex-col md:flex-row justify-center gap-6 px-4 max-w-5xl mx-auto mb-20">
        {[
          ["1,200+", "Verified Pros"],
          ["5,000+", "Jobs Completed"],
          ["100%", "Trusted Network"]
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex-1 text-center hover:shadow-md transition duration-300">
            <h2 className="text-3xl font-black text-[#111827]">{item[0]}</h2>
            <p className="text-gray-500 font-medium mt-1">{item[1]}</p>
          </div>
        ))}
      </div>

      {/* NEW: Top Rated in Area */}
      {localProviders.length > 0 && (
        <div className="max-w-6xl mx-auto mt-10 px-4 mb-20">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl">🔥</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#111827]">Top Rated in Lagos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {localProviders.map((p) => <ProviderCard key={p.id} p={p} />)}
          </div>
        </div>
      )}

      {/* All Featured */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8 border-t border-gray-200 pt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-[#111827]">Discover Artisans</h2>
          <Link to="/services" className="text-[#2563EB] font-bold hover:underline">View Categories &rarr;</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {providersData.map((p) => <ProviderCard key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  );
}

/* --- SERVICES LIST --- */
function Services() {
  const [search, setSearch] = useState("");
  const services = ["Electrician", "Plumber", "Tailor", "Barber", "Carpenter", "Cleaner", "Mechanic", "Painter"];

  const filtered = services.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-[#F9FAFB] min-h-screen py-16 px-4 text-center">
      <h1 className="text-4xl font-extrabold text-[#111827]">Explore Services</h1>
      <p className="mt-3 text-gray-500 font-medium">Find the right professional for your needs.</p>
      
      <input
        placeholder="Search categories..."
        className="mt-8 p-4 border border-gray-200 rounded-xl w-full max-w-md shadow-sm outline-none focus:border-[#2563EB] font-medium"
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-4xl mx-auto">
        {filtered.map((s, i) => (
          <Link to={`/services/${s.toLowerCase()}`} key={i}>
            <div className="bg-white px-6 py-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition duration-200 cursor-pointer flex flex-col items-center justify-center">
              <h3 className="font-bold text-lg text-[#111827]">{s}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* --- SERVICE CATEGORY PAGE --- */
function ServiceCategory() {
  const { category } = useParams();
  const filteredProviders = providersData.filter(p => p.service.toLowerCase() === category.toLowerCase());

  return (
    <div className="bg-[#F9FAFB] min-h-screen py-16 px-4 text-[#111827]">
      <div className="max-w-6xl mx-auto">
        <Link to="/services" className="text-sm font-bold text-gray-500 hover:text-[#2563EB] mb-6 inline-block">&larr; Back to Categories</Link>
        <h1 className="text-3xl md:text-4xl font-extrabold capitalize mb-2">{category}s near you</h1>
        <p className="text-gray-600 mb-10 font-medium">Browse trusted and verified {category.toLowerCase()}s on Crevio.</p>

        {filteredProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProviders.map(p => <ProviderCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 text-center">
            <h2 className="text-2xl font-bold text-gray-400 mb-2">No providers available yet</h2>
            <p className="text-gray-500 mb-6">Be the first to build trust as a {category} on Crevio!</p>
            <Link to="/request"><button className="bg-[#2563EB] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">Register Now</button></Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- SOCIAL FEED --- */
function FeedPost({ post }) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);
  
  const handleLike = () => {
    setLikes(liked ? likes - 1 : likes + 1);
    setLiked(!liked);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#2563EB] text-white rounded-full flex items-center justify-center font-bold">{post.authorName.charAt(0)}</div>
        <Link to={`/provider/${post.authorId}`} className="font-bold text-[#111827] hover:underline">
          {post.authorName} <BadgeCheckIcon />
        </Link>
      </div>
      <img src={post.image} alt="Artisan Work" className="w-full aspect-square object-cover bg-gray-100" />
      <div className="p-4">
        <div className="flex gap-4 mb-3 text-gray-700">
          <button onClick={handleLike} className={`hover:scale-110 transition ${liked ? 'text-red-500' : 'hover:text-gray-500'}`}>
            <svg className="w-7 h-7" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
        </div>
        <p className="font-bold text-sm mb-1">{likes} likes</p>
        <p className="text-sm text-gray-800"><span className="font-bold">{post.authorName}</span> {post.caption}</p>
      </div>
    </div>
  );
}

function Feed() {
  return (
    <div className="bg-[#F9FAFB] min-h-screen py-10 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-extrabold text-[#111827] mb-8">Artisan Feed</h1>
        {feedMockData.map(post => <FeedPost key={post.id} post={post} />)}
      </div>
    </div>
  );
}

/* --- PROVIDER PROFILE (Shareable Mini Website & Quote System) --- */
function ProviderProfile() {
  const { id } = useParams();
  const provider = providersData.find(p => p.id === id);

  // Quick Quote State
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [quoteSent, setQuoteSent] = useState(false);

  if (!provider) return <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]"><h2 className="text-2xl font-bold">Provider not found</h2></div>;

  const isVerified = checkVerification(provider);
  const score = calculateCrevioScore(provider);

  const handleSendQuote = () => {
    if (!quoteText.trim()) return;
    setQuoteSent(true);
  };

  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-20 text-[#111827]">
      {/* Banner Area */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-[#F59E0B] relative"></div>
      
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-20 relative z-10">
        
        {/* LEFT COLUMN: Mini Website Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-gray-100 flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-28 h-28 bg-white p-1 rounded-full shadow-lg shrink-0">
               <div className="w-full h-full bg-[#111827] text-white rounded-full flex items-center justify-center text-5xl font-extrabold">
                {provider.name.charAt(0)}
              </div>
            </div>
            <div className="w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full gap-4">
                <div>
                  <h1 className="text-3xl font-black flex items-center">
                    {provider.name} {isVerified && <BadgeCheckIcon />}
                  </h1>
                  <p className="text-[#2563EB] font-bold mt-1">{provider.service} • {provider.location}</p>
                </div>
                <CrevioScoreBadge score={score} />
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mt-6 text-sm font-medium">
                <span className="flex items-center text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <StarIcon /> <span className="ml-1 text-lg font-bold">{provider.rating}</span> <span className="ml-1 text-gray-500">({provider.reviews} reviews)</span>
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100 italic">"{provider.bio}"</p>
            </div>
          </div>

          {/* Portfolio Gallery */}
          {provider.portfolio && provider.portfolio.length > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-extrabold mb-6">Portfolio</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {provider.portfolio.map((imgUrl, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-sm relative group cursor-pointer">
                    <img src={imgUrl} alt={`Work ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-extrabold mb-6">Client Reviews ({provider.reviewList.length})</h3>
            {provider.reviewList.length > 0 ? (
              <div className="space-y-6">
                {provider.reviewList.map(review => (
                  <div key={review.id} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#111827]">{review.name}</span>
                      <span className="flex text-sm"><StarIcon /> <span className="font-bold ml-1">{review.rating}.0</span></span>
                    </div>
                    <p className="text-gray-600 text-sm">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No reviews yet. Hire {provider.name.split(' ')[0]} to be the first!</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Demand Engine & Contact */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
            
            {/* NEW: QUICK QUOTE SYSTEM */}
            <div className="mb-8 border-b border-gray-100 pb-8">
              <h3 className="font-extrabold text-xl mb-2">Request a Service</h3>
              <p className="text-sm text-gray-500 mb-4">Send job details to get an estimated price.</p>
              
              {!showQuoteForm && !quoteSent && (
                <button onClick={() => setShowQuoteForm(true)} className="w-full bg-[#111827] text-white font-bold px-4 py-3.5 rounded-xl hover:bg-gray-800 shadow-sm hover:scale-[1.02] transition">
                  Get Price / Quote
                </button>
              )}

              {showQuoteForm && !quoteSent && (
                <div className="animate-fade-in">
                  <textarea 
                    autoFocus
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="Describe what you need done..." 
                    className="w-full p-3 border border-gray-300 rounded-xl mb-3 focus:outline-none focus:border-[#2563EB] text-sm h-28 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowQuoteForm(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-lg">Cancel</button>
                    <button onClick={handleSendQuote} className="flex-1 bg-[#2563EB] text-white font-bold py-2 rounded-xl hover:bg-blue-700 transition">Send Request</button>
                  </div>
                </div>
              )}

              {quoteSent && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center">
                  <div className="text-green-600 text-2xl mb-1">✅</div>
                  <h4 className="font-bold text-green-800">Request Sent!</h4>
                  <p className="text-xs text-green-700 mt-1 mb-3">The provider will review and contact you.</p>
                  <a href={`https://wa.me/${provider.whatsapp}?text=Hi ${provider.name}, I found you on Crevio. I requested a quote for: ${encodeURIComponent(quoteText)}`} target="_blank" rel="noreferrer">
                     <button className="w-full bg-green-600 text-white font-bold text-xs py-2 rounded-lg hover:bg-green-700 transition">Follow up on WhatsApp</button>
                  </a>
                </div>
              )}
            </div>

            {/* Direct Contact */}
            <h3 className="font-bold text-lg mb-4">Direct Contact</h3>
            <a href={`https://wa.me/${provider.whatsapp}`} target="_blank" rel="noreferrer" className="block w-full">
              <button className="w-full bg-[#22c55e] text-white font-bold px-4 py-3.5 rounded-xl mb-3 hover:bg-green-600 shadow-sm hover:scale-[1.02] transition flex justify-center items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Chat on WhatsApp
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- GLOBAL REQUEST SYSTEM (Upgraded UI) --- */
function Request() {
  const [form, setForm] = useState({ service: "", city: "", phone: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = () => {
    if (!form.service || !form.city || !form.phone) return alert("Please fill all fields.");
    setIsSubmitted(true);
  };

  return (
    <div className="bg-[#F9FAFB] min-h-screen py-20 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white p-10 rounded-3xl shadow-lg border border-gray-100">
        
        {!isSubmitted ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-[#111827]">Post a Job</h1>
              <p className="mt-2 text-gray-500 font-medium">Let trusted providers come to you.</p>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">What service do you need?</label>
                <input name="service" value={form.service} onChange={handleChange} placeholder="e.g., Plumber, Electrician" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2563EB] focus:bg-white transition font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Where are you located?</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="e.g., Ikeja, Lagos" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2563EB] focus:bg-white transition font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Your Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="We'll notify you via WhatsApp" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2563EB] focus:bg-white transition font-medium" />
              </div> 

              <button onClick={submit} className="w-full bg-[#F59E0B] text-white font-bold text-lg px-6 py-4 rounded-xl mt-4 hover:bg-orange-600 shadow-sm hover:scale-[1.02] transition">
                Submit Request
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
            <h2 className="text-3xl font-black text-[#111827] mb-2">Request Broadcasted!</h2>
            <p className="text-gray-600 font-medium mb-8">Available verified providers in {form.city} will contact you shortly.</p>
            <button onClick={() => { setForm({ service: "", city: "", phone: "" }); setIsSubmitted(false); }} className="text-[#2563EB] font-bold hover:underline">
              Post another job
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- ABOUT --- */
function About() {
  return (
    <div className="bg-[#F9FAFB] min-h-screen py-20 px-4 text-center">
      <div className="max-w-3xl mx-auto bg-white p-12 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-4xl font-black text-[#111827]">About Crevio</h1>
        <p className="mt-8 text-lg text-gray-600 leading-relaxed font-medium">
          Crevio is building the <strong className="text-[#2563EB]">trust layer for informal services</strong>. 
          We believe finding a reliable tailor, electrician, or plumber shouldn't be a gamble. By calculating Reputation Scores, verifying professionals, and showcasing real portfolios, we empower both customers and artisans to do better business.
        </p>
      </div>
    </div>
  );
}

/* --- APP MAIN --- */
export default function App() {
  return (
    <Router>
      <div className="font-sans text-[#111827]">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:category" element={<ServiceCategory />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/request" element={<Request />} />
          <Route path="/about" element={<About />} />
          <Route path="/provider/:id" element={<ProviderProfile />} />
        </Routes>
      </div>
    </Router>
  );
}