"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    name: "Smileys",
    icon: "😀",
    emojis: [
      { emoji: "😀", keywords: ["grinning", "happy", "smile"] },
      { emoji: "😃", keywords: ["smiley", "happy", "joy"] },
      { emoji: "😄", keywords: ["smile", "laugh", "happy"] },
      { emoji: "😁", keywords: ["beam", "grin", "happy"] },
      { emoji: "😆", keywords: ["laughing", "satisfied", "haha"] },
      { emoji: "😅", keywords: ["sweat", "relief", "nervous"] },
      { emoji: "😂", keywords: ["joy", "tears", "laugh", "crying", "lol", "lmao"] },
      { emoji: "🤣", keywords: ["rofl", "rolling", "laughing", "lol"] },
      { emoji: "🥹", keywords: ["holding", "tears", "touched", "grateful"] },
      { emoji: "😊", keywords: ["blush", "smile", "warm"] },
      { emoji: "😇", keywords: ["innocent", "angel", "halo"] },
      { emoji: "🙂", keywords: ["slight", "smile", "okay"] },
      { emoji: "🙃", keywords: ["upside_down", "silly", "sarcasm"] },
      { emoji: "😉", keywords: ["wink", "flirt", "playful"] },
      { emoji: "😌", keywords: ["relieved", "peaceful", "calm"] },
      { emoji: "😍", keywords: ["heart_eyes", "love", "adore"] },
      { emoji: "🥰", keywords: ["smiling_hearts", "love", "affection"] },
      { emoji: "😘", keywords: ["kiss", "love", "blow"] },
      { emoji: "😋", keywords: ["yum", "delicious", "tasty"] },
      { emoji: "😛", keywords: ["tongue", "playful", "silly"] },
      { emoji: "😜", keywords: ["wink_tongue", "crazy", "joke"] },
      { emoji: "🤪", keywords: ["zany", "wild", "goofy"] },
      { emoji: "😎", keywords: ["cool", "sunglasses", "chill"] },
      { emoji: "🤩", keywords: ["star_struck", "excited", "wow"] },
      { emoji: "🥳", keywords: ["party", "celebration", "birthday"] },
      { emoji: "😏", keywords: ["smirk", "suggestive", "flirt"] },
      { emoji: "😒", keywords: ["unamused", "annoyed", "meh"] },
      { emoji: "😞", keywords: ["disappointed", "sad"] },
      { emoji: "😔", keywords: ["pensive", "sad", "down"] },
      { emoji: "😟", keywords: ["worried", "nervous"] },
      { emoji: "😕", keywords: ["confused", "uncertain"] },
      { emoji: "🙁", keywords: ["slight_frown", "sad"] },
      { emoji: "😣", keywords: ["persevering", "struggling"] },
      { emoji: "😫", keywords: ["tired", "exhausted"] },
      { emoji: "😩", keywords: ["weary", "frustrated"] },
      { emoji: "🥺", keywords: ["pleading", "puppy_eyes", "begging"] },
      { emoji: "😢", keywords: ["cry", "sad", "tear"] },
      { emoji: "😭", keywords: ["sob", "crying", "sad", "bawling"] },
      { emoji: "😤", keywords: ["triumph", "proud", "huff"] },
      { emoji: "😠", keywords: ["angry", "mad", "annoyed"] },
      { emoji: "😡", keywords: ["rage", "furious", "red"] },
      { emoji: "🤬", keywords: ["cursing", "swearing", "mad"] },
      { emoji: "🤯", keywords: ["exploding_head", "mind_blown", "shock"] },
      { emoji: "😳", keywords: ["flushed", "embarrassed", "shocked"] },
      { emoji: "🥵", keywords: ["hot", "sweating", "spicy"] },
      { emoji: "🥶", keywords: ["cold", "freezing", "ice"] },
      { emoji: "😱", keywords: ["scream", "shocked", "fear"] },
      { emoji: "😨", keywords: ["fearful", "scared"] },
      { emoji: "😰", keywords: ["anxious", "cold_sweat"] },
      { emoji: "😥", keywords: ["sad_relieved", "whew"] },
      { emoji: "😓", keywords: ["downcast_sweat", "hard_work"] },
      { emoji: "🤗", keywords: ["hugs", "warm", "open"] },
      { emoji: "🤔", keywords: ["thinking", "hmm", "ponder"] },
      { emoji: "🫣", keywords: ["peeking", "shy", "scared"] },
      { emoji: "🤭", keywords: ["giggle", "oops", "hand_over_mouth"] },
      { emoji: "🫢", keywords: ["open_eyes_hand", "gasp", "shock"] },
      { emoji: "🫡", keywords: ["salute", "respect", "yes_sir"] },
      { emoji: "🤫", keywords: ["shh", "quiet", "secret"] },
      { emoji: "🫠", keywords: ["melting", "hot", "embarrassed"] },
      { emoji: "🤐", keywords: ["zipper", "silent", "lips_sealed"] },
      { emoji: "😴", keywords: ["sleeping", "tired", "zzz"] },
      { emoji: "🤤", keywords: ["drooling", "delicious"] },
      { emoji: "🥱", keywords: ["yawn", "bored", "sleepy"] },
    ],
  },
  {
    id: "gestures",
    name: "Hands & Gestures",
    icon: "👍",
    emojis: [
      { emoji: "👋", keywords: ["wave", "hello", "hi", "bye"] },
      { emoji: "🤚", keywords: ["raised_back_of_hand", "stop"] },
      { emoji: "✋", keywords: ["hand", "high_five", "stop"] },
      { emoji: "🖖", keywords: ["vulcan", "spock", "star_trek"] },
      { emoji: "👌", keywords: ["ok", "perfect", "fine"] },
      { emoji: "🤌", keywords: ["pinched_fingers", "italian", "chef"] },
      { emoji: "🤏", keywords: ["pinching", "little_bit", "small"] },
      { emoji: "✌️", keywords: ["peace", "v_sign", "victory"] },
      { emoji: "🤞", keywords: ["fingers_crossed", "luck", "hope"] },
      { emoji: "🫰", keywords: ["hand_heart", "kpop", "money"] },
      { emoji: "🤟", keywords: ["love_you", "rock_on"] },
      { emoji: "🤘", keywords: ["rock", "horns", "metal"] },
      { emoji: "🤙", keywords: ["call_me", "shaka", "hang_loose"] },
      { emoji: "👈", keywords: ["point_left"] },
      { emoji: "👉", keywords: ["point_right"] },
      { emoji: "👆", keywords: ["point_up"] },
      { emoji: "👇", keywords: ["point_down"] },
      { emoji: "👍", keywords: ["thumbs_up", "yes", "like", "approve", "good"] },
      { emoji: "👎", keywords: ["thumbs_down", "no", "dislike", "bad"] },
      { emoji: "✊", keywords: ["fist", "power"] },
      { emoji: "👊", keywords: ["punch", "fist_bump"] },
      { emoji: "🤛", keywords: ["left_facing_fist", "fist_bump"] },
      { emoji: "🤜", keywords: ["right_facing_fist", "fist_bump"] },
      { emoji: "👏", keywords: ["clap", "applause", "bravo"] },
      { emoji: "🙌", keywords: ["hands_up", "celebration", "praise"] },
      { emoji: "🫶", keywords: ["heart_hands", "love"] },
      { emoji: "👐", keywords: ["open_hands", "hug"] },
      { emoji: "🤲", keywords: ["palms_up_together", "pray"] },
      { emoji: "🤝", keywords: ["handshake", "deal", "agreement"] },
      { emoji: "🙏", keywords: ["pray", "please", "thanks", "namaste"] },
      { emoji: "💪", keywords: ["muscle", "flex", "strong", "gym"] },
      { emoji: "👀", keywords: ["eyes", "look", "see", "watching"] },
      { emoji: "👥", keywords: ["people", "group", "users"] },
    ],
  },
  {
    id: "hearts",
    name: "Hearts & Sparkles",
    icon: "❤️",
    emojis: [
      { emoji: "❤️", keywords: ["heart", "love", "red_heart"] },
      { emoji: "🧡", keywords: ["orange_heart", "love"] },
      { emoji: "💛", keywords: ["yellow_heart", "love", "friendship"] },
      { emoji: "💚", keywords: ["green_heart", "love", "nature"] },
      { emoji: "💙", keywords: ["blue_heart", "love", "trust"] },
      { emoji: "💜", keywords: ["purple_heart", "love"] },
      { emoji: "🖤", keywords: ["black_heart", "love", "dark"] },
      { emoji: "🤍", keywords: ["white_heart", "love", "pure"] },
      { emoji: "🤎", keywords: ["brown_heart", "love"] },
      { emoji: "💔", keywords: ["broken_heart", "sad", "breakup"] },
      { emoji: "❤️‍🔥", keywords: ["heart_on_fire", "passion", "desire"] },
      { emoji: "❤️‍🩹", keywords: ["mending_heart", "healing"] },
      { emoji: "❣️", keywords: ["heart_exclamation"] },
      { emoji: "💕", keywords: ["two_hearts", "love"] },
      { emoji: "💞", keywords: ["revolving_hearts", "love"] },
      { emoji: "💓", keywords: ["beating_heart", "love"] },
      { emoji: "💗", keywords: ["growing_heart", "love"] },
      { emoji: "💖", keywords: ["sparkling_heart", "love", "special"] },
      { emoji: "💘", keywords: ["cupid", "arrow", "love"] },
      { emoji: "💝", keywords: ["gift_heart", "ribbon"] },
      { emoji: "🔥", keywords: ["fire", "flame", "lit", "hot"] },
      { emoji: "✨", keywords: ["sparkles", "shine", "magic", "clean"] },
      { emoji: "⭐", keywords: ["star", "rating", "favorite"] },
      { emoji: "🌟", keywords: ["glowing_star", "shine"] },
      { emoji: "💫", keywords: ["dizzy", "sparkle"] },
      { emoji: "💥", keywords: ["boom", "collision", "explosion"] },
      { emoji: "💯", keywords: ["hundred", "perfect", "score", "keep_it_100"] },
      { emoji: "💬", keywords: ["speech_bubble", "chat", "message"] },
      { emoji: "💭", keywords: ["thought_bubble", "thinking"] },
    ],
  },
  {
    id: "objects",
    name: "Objects & Fun",
    icon: "🎉",
    emojis: [
      { emoji: "🎉", keywords: ["party_popper", "tada", "celebration"] },
      { emoji: "🎊", keywords: ["confetti_ball", "celebrate"] },
      { emoji: "🎈", keywords: ["balloon", "birthday"] },
      { emoji: "🎂", keywords: ["birthday_cake", "cake"] },
      { emoji: "🎁", keywords: ["gift", "present"] },
      { emoji: "🏆", keywords: ["trophy", "winner", "first"] },
      { emoji: "🥇", keywords: ["gold_medal", "first_place"] },
      { emoji: "🎯", keywords: ["bullseye", "target", "direct_hit"] },
      { emoji: "🚀", keywords: ["rocket", "launch", "fast", "to_the_moon"] },
      { emoji: "💡", keywords: ["light_bulb", "idea"] },
      { emoji: "💻", keywords: ["laptop", "computer", "code", "work"] },
      { emoji: "📱", keywords: ["mobile_phone", "phone"] },
      { emoji: "🕹️", keywords: ["video_game", "joystick", "gaming"] },
      { emoji: "🎧", keywords: ["headphones", "music"] },
      { emoji: "☕", keywords: ["coffee", "tea", "cafe"] },
      { emoji: "🍕", keywords: ["pizza", "food"] },
      { emoji: "🍔", keywords: ["hamburger", "burger", "food"] },
      { emoji: "🍟", keywords: ["french_fries", "fries", "food"] },
      { emoji: "🍻", keywords: ["beers", "cheers"] },
      { emoji: "🥂", keywords: ["clinking_glasses", "toast", "celebrate"] },
      { emoji: "🍿", keywords: ["popcorn", "movie"] },
      { emoji: "🍩", keywords: ["doughnut", "donut"] },
      { emoji: "🍪", keywords: ["cookie", "sweet"] },
      { emoji: "📌", keywords: ["pushpin", "pin"] },
      { emoji: "📍", keywords: ["round_pushpin", "location"] },
      { emoji: "📝", keywords: ["memo", "pencil", "note"] },
      { emoji: "✉️", keywords: ["envelope", "email", "letter"] },
      { emoji: "📦", keywords: ["package", "box", "delivery"] },
      { emoji: "🔒", keywords: ["locked", "security"] },
      { emoji: "🔑", keywords: ["key", "password"] },
    ],
  },
];

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState("smileys");
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Filter emojis based on search query
  const filteredEmojis = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return null;

    const results = [];
    EMOJI_CATEGORIES.forEach((category) => {
      category.emojis.forEach((item) => {
        if (
          item.keywords.some((k) => k.includes(query)) ||
          item.emoji.includes(query)
        ) {
          results.push(item.emoji);
        }
      });
    });
    return Array.from(new Set(results));
  }, [search]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full mb-3 left-0 sm:left-2 w-80 sm:w-88 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 overflow-hidden flex flex-col animate-fadeIn"
      style={{ maxHeight: "360px" }}
    >
      {/* Header & Search */}
      <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/90 flex items-center gap-2">
        <div className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis..."
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <HiXMark className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs (shown when not searching) */}
      {!search && (
        <div className="flex items-center justify-around border-b border-zinc-100 dark:border-zinc-800/80 px-2 py-1 bg-zinc-50/40 dark:bg-zinc-900/50 select-none">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-2.5 py-1 text-sm rounded-lg transition-all ${
                activeTab === cat.id
                  ? "bg-white dark:bg-zinc-800 shadow-2xs scale-105"
                  : "opacity-60 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              }`}
              title={cat.name}
            >
              <span>{cat.icon}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid Area */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {filteredEmojis ? (
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2 px-1">
              Search Results ({filteredEmojis.length})
            </div>
            {filteredEmojis.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-500">
                No emojis found for &quot;{search}&quot;
              </div>
            ) : (
              <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => onSelect(emoji)}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-lg active:scale-90 transition-transform select-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {EMOJI_CATEGORIES.filter((cat) => cat.id === activeTab).map(
              (category) => (
                <div key={category.id}>
                  <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2 px-1 flex items-center justify-between">
                    <span>{category.name}</span>
                    <span className="text-[10px] opacity-70">
                      {category.emojis.length} emojis
                    </span>
                  </div>
                  <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
                    {category.emojis.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => onSelect(item.emoji)}
                        className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-lg active:scale-90 transition-transform select-none"
                        title={item.keywords[0]}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
