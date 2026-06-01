import React from 'react'

interface RankedPack {
  id: string
  name: string
  slug: string
  downloads: number
  wishlists: number
  is_featured: boolean
  display_rank: number
  popularityScore: number
}

interface RankingsTabProps {
  rankedPacks: RankedPack[]
  updatePackRankInline: (pack: RankedPack, rankVal: string) => void
}

export function RankingsTab({
  rankedPacks,
  updatePackRankInline
}: RankingsTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs leading-relaxed">
      {/* ALGORITHMIC FORMULA CARD */}
      <div className="border border-zinc-800 bg-studio-charcoal p-6 rounded-lg relative">
        <div className="absolute top-0 right-0 bg-studio-yellow text-black text-[9px] font-black uppercase px-2.5 py-1 border-l border-b border-zinc-800 rounded-bl">
          POPULARITY FORMULA
        </div>
        <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-studio-yellow mb-2">
          🌟 Algorithmic Compound Scoring
        </h3>
        <p className="text-zinc-300 text-xs font-mono max-w-3xl mb-4 leading-relaxed">
          Store display ordering uses a weighted compound algorithm. Standard featured flags boost ranking scores by 50, manual display priorities inject multipliers (+10 per rank value), and real customer interactions provide dynamic trending telemetry.
        </p>
        <div className="bg-black border border-zinc-800 p-4 rounded font-mono text-studio-neon font-black text-center text-xs tracking-wider">
          SCORE = (DOWNLOADS * 2) + (WISHLISTS * 5) + (FEATURED ? 50 : 0) + (PRIORITY_RANK * 10)
        </div>
      </div>

      {/* GLOBAL LEADERBOARD */}
      <div className="bg-[#121212] p-6 border border-zinc-800 rounded-lg">
        <h3 className="font-sans font-bold text-lg uppercase tracking-wider text-white">
          🏆 STORE LEADERBOARD RANKINGS
        </h3>
      </div>

      <div className="border border-zinc-800 bg-black rounded-lg overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-left uppercase font-black border-collapse">
            <thead>
              <tr className="bg-[#121212] border-b border-zinc-800 text-zinc-400">
                <th className="p-4 w-12 text-center">RANK</th>
                <th className="p-4">PACK NAME</th>
                <th className="p-4 text-center">DOWNLOADS</th>
                <th className="p-4 text-center">WISHLIST SAVES</th>
                <th className="p-4 text-center">FEATURED BOOST</th>
                <th className="p-4 text-center">MANUAL PRIORITY RANK</th>
                <th className="p-4 text-center text-studio-neon">SCORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-mono text-xs">
              {rankedPacks.map((pack: any, idx: number) => {
                return (
                  <tr key={pack.id} className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors">
                    <td className="p-4 text-center">
                      <span className={`w-7 h-7 rounded flex items-center justify-center font-bold text-sm border border-zinc-800 mx-auto ${
                        idx === 0 ? 'bg-studio-yellow text-black' : idx === 1 ? 'bg-studio-pink text-white border-studio-pink/30' : idx === 2 ? 'bg-studio-neon text-black' : 'bg-black text-zinc-400'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-sm normal-case text-white">{pack.name}</p>
                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5 lowercase">{pack.slug}</p>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-zinc-300">
                      {pack.downloads} HITS
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-zinc-300">
                      {pack.wishlists} SAVES
                    </td>
                    <td className="p-4 text-center font-mono font-bold">
                      {pack.is_featured ? (
                        <span className="text-studio-neon bg-studio-neon/10 border border-studio-neon/30 px-2 py-0.5 text-[9px] rounded">+50 BOOST</span>
                      ) : (
                        <span className="text-zinc-600">0</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          defaultValue={pack.display_rank || 0}
                          onBlur={(e) => updatePackRankInline(pack, e.target.value)}
                          className="w-16 bg-black border border-zinc-800 p-1 text-center font-bold font-mono text-white text-xs outline-none focus:border-studio-pink rounded"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-md text-studio-neon tracking-wider">
                      {pack.popularityScore} PTS
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
