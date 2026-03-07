export default function Focusmode({activeSentence,togglePlayPause,isPlaying}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 transition-opacity duration-500">
      <div onClick={togglePlayPause} className="text-3xl md:text-4xl lg:text-5xl text-gray-800 font-bold leading-relaxed text-center min-h-[150px] flex items-center justify-center transition-all duration-300">
        {activeSentence}
      </div>

      
    </div>
  );
}
