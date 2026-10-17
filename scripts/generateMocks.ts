import fs from "fs";
import path from "path";
import type {
  Province,
  KabKota,
  ExplanationData,
  RiskFactor,
  RecommendationItem,
  IndicatorId,
  RegionType,
} from "../lib/types";
import { getRiskLevelFromScore } from "../lib/colorScale";

// Deterministic PRNG (Mulberry32)
function createSeededRandom(seed: number) {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface RawProvinceDef {
  id: string;
  name: string;
  islandGroup: string;
  baseRisk: number;
  prevalence: number;
  centroid: [number, number]; // [lon, lat]
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  kabKotaList: string[];
}

// All 38 Official Provinces of Indonesia with realistic coordinates & sample/full Kab/Kota
const PROVINCE_DEFS: RawProvinceDef[] = [
  {
    id: "11",
    name: "Aceh",
    islandGroup: "Sumatera",
    baseRisk: 68,
    prevalence: 29.4,
    centroid: [96.75, 4.69],
    bbox: [95.2, 2.1, 98.3, 5.9],
    kabKotaList: [
      "Kab. Aceh Utara",
      "Kab. Pidie",
      "Kab. Aceh Timur",
      "Kab. Bireuen",
      "Kab. Aceh Besar",
      "Kab. Aceh Tengah",
      "Kab. Aceh Selatan",
      "Kab. Aceh Barat",
      "Kab. Aceh Tenggara",
      "Kab. Aceh Tamiang",
      "Kab. Nagan Raya",
      "Kab. Aceh Jaya",
      "Kab. Bener Meriah",
      "Kab. Pidie Jaya",
      "Kab. Gayo Lues",
      "Kab. Aceh Singkil",
      "Kab. Aceh Barat Daya",
      "Kab. Simeulue",
      "Kota Subulussalam",
      "Kota Lhokseumawe",
      "Kota Langsa",
      "Kota Sabang",
      "Kota Banda Aceh",
    ],
  },
  {
    id: "12",
    name: "Sumatera Utara",
    islandGroup: "Sumatera",
    baseRisk: 54,
    prevalence: 21.1,
    centroid: [99.15, 2.11],
    bbox: [97.0, 0.4, 100.4, 4.3],
    kabKotaList: [
      "Kab. Nias Selatan",
      "Kab. Nias",
      "Kab. Nias Utara",
      "Kab. Nias Barat",
      "Kab. Mandailing Natal",
      "Kab. Padang Lawas",
      "Kab. Tapanuli Tengah",
      "Kab. Tapanuli Utara",
      "Kab. Tapanuli Selatan",
      "Kab. Dairi",
      "Kab. Pakpak Bharat",
      "Kab. Humbang Hasundutan",
      "Kab. Samosir",
      "Kab. Simalungun",
      "Kab. Karo",
      "Kab. Langkat",
      "Kab. Deli Serdang",
      "Kab. Serdang Bedagai",
      "Kab. Batu Bara",
      "Kab. Asahan",
      "Kab. Labuhanbatu",
      "Kab. Labuhanbatu Utara",
      "Kab. Labuhanbatu Selatan",
      "Kab. Padang Lawas Utara",
      "Kab. Toba",
      "Kota Gunungsitoli",
      "Kota Sibolga",
      "Kota Padangsidimpuan",
      "Kota Tanjungbalai",
      "Kota Tebing Tinggi",
      "Kota Binjai",
      "Kota Pematangsiantar",
      "Kota Medan",
    ],
  },
  {
    id: "13",
    name: "Sumatera Barat",
    islandGroup: "Sumatera",
    baseRisk: 52,
    prevalence: 23.6,
    centroid: [100.6, -0.74],
    bbox: [98.6, -3.5, 101.9, 0.9],
    kabKotaList: [
      "Kab. Kepulauan Mentawai",
      "Kab. Pasaman Barat",
      "Kab. Pasaman",
      "Kab. Pesisir Selatan",
      "Kab. Solok Selatan",
      "Kab. Solok",
      "Kab. Sijunjung",
      "Kab. Lima Puluh Kota",
      "Kab. Agam",
      "Kab. Padang Pariaman",
      "Kab. Tanah Datar",
      "Kab. Dharmasraya",
      "Kota Pariaman",
      "Kota Solok",
      "Kota Sawahlunto",
      "Kota Padang Panjang",
      "Kota Payakumbuh",
      "Kota Bukittinggi",
      "Kota Padang",
    ],
  },
  {
    id: "14",
    name: "Riau",
    islandGroup: "Sumatera",
    baseRisk: 42,
    prevalence: 17.0,
    centroid: [101.7, 0.5],
    bbox: [100.0, -1.0, 103.8, 2.5],
    kabKotaList: [
      "Kab. Kepulauan Meranti",
      "Kab. Rokan Hilir",
      "Kab. Rokan Hulu",
      "Kab. Indragiri Hilir",
      "Kab. Indragiri Hulu",
      "Kab. Kampar",
      "Kab. Pelalawan",
      "Kab. Kuantan Singingi",
      "Kab. Bengkalis",
      "Kab. Siak",
      "Kota Dumai",
      "Kota Pekanbaru",
    ],
  },
  {
    id: "15",
    name: "Jambi",
    islandGroup: "Sumatera",
    baseRisk: 38,
    prevalence: 18.0,
    centroid: [102.7, -1.61],
    bbox: [101.1, -2.8, 104.5, -0.7],
    kabKotaList: [
      "Kab. Tanjung Jabung Timur",
      "Kab. Tanjung Jabung Barat",
      "Kab. Kerinci",
      "Kab. Merangin",
      "Kab. Sarolangun",
      "Kab. Batanghari",
      "Kab. Tebo",
      "Kab. Bungo",
      "Kab. Muaro Jambi",
      "Kota Sungai Penuh",
      "Kota Jambi",
    ],
  },
  {
    id: "16",
    name: "Sumatera Selatan",
    islandGroup: "Sumatera",
    baseRisk: 46,
    prevalence: 18.6,
    centroid: [104.1, -3.32],
    bbox: [102.1, -4.9, 106.2, -1.6],
    kabKotaList: [
      "Kab. Musi Rawas Utara",
      "Kab. Empat Lawang",
      "Kab. Ogan Komering Ilir",
      "Kab. Ogan Ilir",
      "Kab. Banyuasin",
      "Kab. Musi Banyuasin",
      "Kab. Musi Rawas",
      "Kab. Lahat",
      "Kab. Muara Enim",
      "Kab. Penukal Abab Lematang Ilir",
      "Kab. Ogan Komering Ulu",
      "Kab. Ogan Komering Ulu Timur",
      "Kab. Ogan Komering Ulu Selatan",
      "Kota Pagar Alam",
      "Kota Lubuklinggau",
      "Kota Prabumulih",
      "Kota Palembang",
    ],
  },
  {
    id: "17",
    name: "Bengkulu",
    islandGroup: "Sumatera",
    baseRisk: 47,
    prevalence: 19.8,
    centroid: [102.26, -3.79],
    bbox: [101.0, -5.0, 103.8, -2.3],
    kabKotaList: [
      "Kab. Kaur",
      "Kab. Seluma",
      "Kab. Bengkulu Tengah",
      "Kab. Bengkulu Utara",
      "Kab. Bengkulu Selatan",
      "Kab. Kepahiang",
      "Kab. Rejang Lebong",
      "Kab. Lebong",
      "Kab. Mukomuko",
      "Kota Bengkulu",
    ],
  },
  {
    id: "18",
    name: "Lampung",
    islandGroup: "Sumatera",
    baseRisk: 41,
    prevalence: 15.2,
    centroid: [105.0, -4.85],
    bbox: [103.6, -6.0, 106.0, -3.7],
    kabKotaList: [
      "Kab. Pesisir Barat",
      "Kab. Tanggamus",
      "Kab. Lampung Barat",
      "Kab. Way Kanan",
      "Kab. Lampung Utara",
      "Kab. Lampung Selatan",
      "Kab. Lampung Timur",
      "Kab. Lampung Tengah",
      "Kab. Pesawaran",
      "Kab. Tulang Bawang",
      "Kab. Mesuji",
      "Kab. Tulang Bawang Barat",
      "Kab. Pringsewu",
      "Kota Bandar Lampung",
      "Kota Metro",
    ],
  },
  {
    id: "19",
    name: "Kepulauan Bangka Belitung",
    islandGroup: "Sumatera",
    baseRisk: 34,
    prevalence: 18.5,
    centroid: [106.4, -2.5],
    bbox: [105.1, -3.4, 108.4, -1.5],
    kabKotaList: [
      "Kab. Bangka Selatan",
      "Kab. Bangka Barat",
      "Kab. Bangka Tengah",
      "Kab. Bangka",
      "Kab. Belitung Timur",
      "Kab. Belitung",
      "Kota Pangkalpinang",
    ],
  },
  {
    id: "21",
    name: "Kepulauan Riau",
    islandGroup: "Sumatera",
    baseRisk: 27,
    prevalence: 15.4,
    centroid: [104.5, 0.9],
    bbox: [103.3, 0.1, 106.0, 1.5],
    kabKotaList: [
      "Kab. Lingga",
      "Kab. Natuna",
      "Kab. Kepulauan Anambas",
      "Kab. Karimun",
      "Kab. Bintan",
      "Kota Tanjungpinang",
      "Kota Batam",
    ],
  },
  {
    id: "31",
    name: "DKI Jakarta",
    islandGroup: "Jawa",
    baseRisk: 22,
    prevalence: 14.8,
    centroid: [106.84, -6.2],
    bbox: [106.65, -6.38, 106.98, -6.08],
    kabKotaList: [
      "Kab. Administrasi Kepulauan Seribu",
      "Kota Administrasi Jakarta Utara",
      "Kota Administrasi Jakarta Barat",
      "Kota Administrasi Jakarta Timur",
      "Kota Administrasi Jakarta Pusat",
      "Kota Administrasi Jakarta Selatan",
    ],
  },
  {
    id: "32",
    name: "Jawa Barat",
    islandGroup: "Jawa",
    baseRisk: 49,
    prevalence: 20.2,
    centroid: [107.61, -6.91],
    bbox: [106.37, -7.82, 108.84, -5.91],
    kabKotaList: [
      "Kab. Garut",
      "Kab. Tasikmalaya",
      "Kab. Cianjur",
      "Kab. Sukabumi",
      "Kab. Bandung Barat",
      "Kab. Bandung",
      "Kab. Sumedang",
      "Kab. Majalengka",
      "Kab. Kuningan",
      "Kab. Cirebon",
      "Kab. Indramayu",
      "Kab. Subang",
      "Kab. Purwakarta",
      "Kab. Karawang",
      "Kab. Bogor",
      "Kab. Ciamis",
      "Kab. Pangandaran",
      "Kab. Bekasi",
      "Kota Tasikmalaya",
      "Kota Banjar",
      "Kota Sukabumi",
      "Kota Cirebon",
      "Kota Cimahi",
      "Kota Bogor",
      "Kota Bandung",
      "Kota Bekasi",
      "Kota Depok",
    ],
  },
  {
    id: "33",
    name: "Jawa Tengah",
    islandGroup: "Jawa",
    baseRisk: 48,
    prevalence: 20.8,
    centroid: [110.14, -7.15],
    bbox: [108.7, -8.2, 111.7, -6.4],
    kabKotaList: [
      "Kab. Brebes",
      "Kab. Wonosobo",
      "Kab. Pemalang",
      "Kab. Banjarnegara",
      "Kab. Kebumen",
      "Kab. Purbalingga",
      "Kab. Tegal",
      "Kab. Pekalongan",
      "Kab. Batang",
      "Kab. Banyumas",
      "Kab. Cilacap",
      "Kab. Magelang",
      "Kab. Temanggung",
      "Kab. Purworejo",
      "Kab. Wonogiri",
      "Kab. Klaten",
      "Kab. Boyolali",
      "Kab. Sragen",
      "Kab. Karanganyar",
      "Kab. Sukoharjo",
      "Kab. Grobogan",
      "Kab. Blora",
      "Kab. Rembang",
      "Kab. Pati",
      "Kab. Kudus",
      "Kab. Jepara",
      "Kab. Demak",
      "Kab. Kendal",
      "Kab. Semarang",
      "Kota Tegal",
      "Kota Pekalongan",
      "Kota Magelang",
      "Kota Salatiga",
      "Kota Surakarta",
      "Kota Semarang",
    ],
  },
  {
    id: "34",
    name: "DI Yogyakarta",
    islandGroup: "Jawa",
    baseRisk: 24,
    prevalence: 16.4,
    centroid: [110.36, -7.87],
    bbox: [110.0, -8.2, 110.85, -7.54],
    kabKotaList: [
      "Kab. Gunungkidul",
      "Kab. Kulon Progo",
      "Kab. Bantul",
      "Kab. Sleman",
      "Kota Yogyakarta",
    ],
  },
  {
    id: "35",
    name: "Jawa Timur",
    islandGroup: "Jawa",
    baseRisk: 45,
    prevalence: 19.2,
    centroid: [112.5, -7.65],
    bbox: [111.0, -8.78, 114.6, -6.8],
    kabKotaList: [
      "Kab. Bangkalan",
      "Kab. Sampang",
      "Kab. Pamekasan",
      "Kab. Sumenep",
      "Kab. Bondowoso",
      "Kab. Situbondo",
      "Kab. Probolinggo",
      "Kab. Jember",
      "Kab. Lumajang",
      "Kab. Pasuruan",
      "Kab. Malang",
      "Kab. Banyuwangi",
      "Kab. Bojonegoro",
      "Kab. Tuban",
      "Kab. Lamongan",
      "Kab. Ngawi",
      "Kab. Magetan",
      "Kab. Ponorogo",
      "Kab. Pacitan",
      "Kab. Trenggalek",
      "Kab. Tulungagung",
      "Kab. Blitar",
      "Kab. Kediri",
      "Kab. Nganjuk",
      "Kab. Jombang",
      "Kab. Mojokerto",
      "Kab. Gresik",
      "Kab. Madiun",
      "Kab. Sidoarjo",
      "Kota Probolinggo",
      "Kota Pasuruan",
      "Kota Kediri",
      "Kota Blitar",
      "Kota Mojokerto",
      "Kota Madiun",
      "Kota Batu",
      "Kota Malang",
      "Kota Surabaya",
    ],
  },
  {
    id: "36",
    name: "Banten",
    islandGroup: "Jawa",
    baseRisk: 46,
    prevalence: 20.0,
    centroid: [106.15, -6.4],
    bbox: [105.1, -7.0, 106.7, -5.85],
    kabKotaList: [
      "Kab. Pandeglang",
      "Kab. Lebak",
      "Kab. Serang",
      "Kab. Tangerang",
      "Kota Serang",
      "Kota Cilegon",
      "Kota Tangerang",
      "Kota Tangerang Selatan",
    ],
  },
  {
    id: "51",
    name: "Bali",
    islandGroup: "Bali & Nusa Tenggara",
    baseRisk: 14,
    prevalence: 8.0,
    centroid: [115.18, -8.4],
    bbox: [114.43, -8.85, 115.71, -8.06],
    kabKotaList: [
      "Kab. Karangasem",
      "Kab. Bangli",
      "Kab. Buleleng",
      "Kab. Jembrana",
      "Kab. Klungkung",
      "Kab. Tabanan",
      "Kab. Gianyar",
      "Kab. Badung",
      "Kota Denpasar",
    ],
  },
  {
    id: "52",
    name: "Nusa Tenggara Barat",
    islandGroup: "Bali & Nusa Tenggara",
    baseRisk: 76,
    prevalence: 32.7,
    centroid: [117.36, -8.65],
    bbox: [115.8, -9.1, 119.3, -8.1],
    kabKotaList: [
      "Kab. Lombok Utara",
      "Kab. Lombok Tengah",
      "Kab. Lombok Timur",
      "Kab. Lombok Barat",
      "Kab. Dompu",
      "Kab. Bima",
      "Kab. Sumbawa",
      "Kab. Sumbawa Barat",
      "Kota Bima",
      "Kota Mataram",
    ],
  },
  {
    id: "53",
    name: "Nusa Tenggara Timur",
    islandGroup: "Bali & Nusa Tenggara",
    baseRisk: 89,
    prevalence: 35.3,
    centroid: [121.08, -9.4],
    bbox: [118.9, -10.9, 125.2, -8.1],
    kabKotaList: [
      "Kab. Timor Tengah Selatan",
      "Kab. Timor Tengah Utara",
      "Kab. Sumba Barat Daya",
      "Kab. Sumba Tengah",
      "Kab. Sumba Timur",
      "Kab. Sumba Barat",
      "Kab. Manggarai Timur",
      "Kab. Manggarai",
      "Kab. Manggarai Barat",
      "Kab. Kupang",
      "Kab. Rote Ndao",
      "Kab. Sabu Raijua",
      "Kab. Malaka",
      "Kab. Belu",
      "Kab. Alor",
      "Kab. Lembata",
      "Kab. Flores Timur",
      "Kab. Sikka",
      "Kab. Ende",
      "Kab. Nagekeo",
      "Kab. Ngada",
      "Kota Kupang",
    ],
  },
  {
    id: "61",
    name: "Kalimantan Barat",
    islandGroup: "Kalimantan",
    baseRisk: 64,
    prevalence: 27.8,
    centroid: [110.5, -0.13],
    bbox: [108.6, -3.0, 114.2, 2.0],
    kabKotaList: [
      "Kab. Melawi",
      "Kab. Kapuas Hulu",
      "Kab. Sintang",
      "Kab. Sekadau",
      "Kab. Sanggau",
      "Kab. Landak",
      "Kab. Bengkayang",
      "Kab. Sambas",
      "Kab. Kayong Utara",
      "Kab. Ketapang",
      "Kab. Kubu Raya",
      "Kab. Mempawah",
      "Kota Singkawang",
      "Kota Pontianak",
    ],
  },
  {
    id: "62",
    name: "Kalimantan Tengah",
    islandGroup: "Kalimantan",
    baseRisk: 59,
    prevalence: 26.9,
    centroid: [113.4, -1.68],
    bbox: [110.7, -3.5, 115.8, 0.8],
    kabKotaList: [
      "Kab. Kapuas",
      "Kab. Barito Timur",
      "Kab. Barito Selatan",
      "Kab. Barito Utara",
      "Kab. Murung Raya",
      "Kab. Gunung Mas",
      "Kab. Pulang Pisau",
      "Kab. Katingan",
      "Kab. Kotawaringin Timur",
      "Kab. Seruyan",
      "Kab. Kotawaringin Barat",
      "Kab. Sukamara",
      "Kab. Lamandau",
      "Kota Palangka Raya",
    ],
  },
  {
    id: "63",
    name: "Kalimantan Selatan",
    islandGroup: "Kalimantan",
    baseRisk: 56,
    prevalence: 24.6,
    centroid: [115.35, -3.09],
    bbox: [114.3, -4.2, 116.5, -1.3],
    kabKotaList: [
      "Kab. Hulu Sungai Utara",
      "Kab. Hulu Sungai Tengah",
      "Kab. Hulu Sungai Selatan",
      "Kab. Barito Kuala",
      "Kab. Tapin",
      "Kab. Banjar",
      "Kab. Tanah Laut",
      "Kab. Tanah Bumbu",
      "Kab. Kotabaru",
      "Kab. Balangan",
      "Kab. Tabalong",
      "Kota Banjarmasin",
      "Kota Banjarbaru",
    ],
  },
  {
    id: "64",
    name: "Kalimantan Timur",
    islandGroup: "Kalimantan",
    baseRisk: 48,
    prevalence: 23.9,
    centroid: [116.4, 0.53],
    bbox: [113.8, -2.4, 119.0, 2.6],
    kabKotaList: [
      "Kab. Mahakam Ulu",
      "Kab. Kutai Barat",
      "Kab. Kutai Kartanegara",
      "Kab. Kutai Timur",
      "Kab. Paser",
      "Kab. Penajam Paser Utara",
      "Kab. Berau",
      "Kota Bontang",
      "Kota Samarinda",
      "Kota Balikpapan",
    ],
  },
  {
    id: "65",
    name: "Kalimantan Utara",
    islandGroup: "Kalimantan",
    baseRisk: 47,
    prevalence: 22.1,
    centroid: [116.1, 3.07],
    bbox: [114.5, 1.3, 118.0, 4.4],
    kabKotaList: [
      "Kab. Nunukan",
      "Kab. Malinau",
      "Kab. Bulungan",
      "Kab. Tana Tidung",
      "Kota Tarakan",
    ],
  },
  {
    id: "71",
    name: "Sulawesi Utara",
    islandGroup: "Sulawesi",
    baseRisk: 43,
    prevalence: 20.5,
    centroid: [124.5, 0.95],
    bbox: [123.1, 0.3, 127.0, 4.5],
    kabKotaList: [
      "Kab. Bolaang Mongondow Utara",
      "Kab. Bolaang Mongondow Selatan",
      "Kab. Bolaang Mongondow Timur",
      "Kab. Bolaang Mongondow",
      "Kab. Kepulauan Sangihe",
      "Kab. Kepulauan Talaud",
      "Kab. Kepulauan Siau Tagulandang Biaro",
      "Kab. Minahasa Selatan",
      "Kab. Minahasa Tenggara",
      "Kab. Minahasa Utara",
      "Kab. Minahasa",
      "Kota Kotamobagu",
      "Kota Bitung",
      "Kota Tomohon",
      "Kota Manado",
    ],
  },
  {
    id: "72",
    name: "Sulawesi Tengah",
    islandGroup: "Sulawesi",
    baseRisk: 67,
    prevalence: 28.2,
    centroid: [121.0, -1.43],
    bbox: [119.4, -3.2, 123.9, 1.3],
    kabKotaList: [
      "Kab. Sigi",
      "Kab. Donggala",
      "Kab. Parigi Moutong",
      "Kab. Tojo Una-Una",
      "Kab. Poso",
      "Kab. Toli-Toli",
      "Kab. Buol",
      "Kab. Banggai Kepulauan",
      "Kab. Banggai Laut",
      "Kab. Banggai",
      "Kab. Morowali Utara",
      "Kab. Morowali",
      "Kota Palu",
    ],
  },
  {
    id: "73",
    name: "Sulawesi Selatan",
    islandGroup: "Sulawesi",
    baseRisk: 65,
    prevalence: 27.2,
    centroid: [119.97, -3.66],
    bbox: [118.9, -6.5, 121.6, -1.9],
    kabKotaList: [
      "Kab. Jeneponto",
      "Kab. Takalar",
      "Kab. Gowa",
      "Kab. Bone",
      "Kab. Enrekang",
      "Kab. Tana Toraja",
      "Kab. Toraja Utara",
      "Kab. Luwu Utara",
      "Kab. Luwu Timur",
      "Kab. Luwu",
      "Kab. Pinrang",
      "Kab. Sidrap",
      "Kab. Wajo",
      "Kab. Soppeng",
      "Kab. Sinjai",
      "Kab. Bulukumba",
      "Kab. Bantaeng",
      "Kab. Kepulauan Selayar",
      "Kab. Maros",
      "Kab. Pangkajene dan Kepulauan",
      "Kab. Barru",
      "Kota Palopo",
      "Kota Parepare",
      "Kota Makassar",
    ],
  },
  {
    id: "74",
    name: "Sulawesi Tenggara",
    islandGroup: "Sulawesi",
    baseRisk: 66,
    prevalence: 27.7,
    centroid: [122.17, -4.14],
    bbox: [120.8, -5.8, 124.1, -2.8],
    kabKotaList: [
      "Kab. Buton Tengah",
      "Kab. Buton Selatan",
      "Kab. Buton Utara",
      "Kab. Buton",
      "Kab. Muna Barat",
      "Kab. Muna",
      "Kab. Wakatobi",
      "Kab. Bombana",
      "Kab. Konawe Kepulauan",
      "Kab. Konawe Selatan",
      "Kab. Konawe Utara",
      "Kab. Konawe",
      "Kab. Kolaka Timur",
      "Kab. Kolaka Utara",
      "Kab. Kolaka",
      "Kota Baubau",
      "Kota Kendari",
    ],
  },
  {
    id: "75",
    name: "Gorontalo",
    islandGroup: "Sulawesi",
    baseRisk: 57,
    prevalence: 23.8,
    centroid: [122.45, 0.69],
    bbox: [121.1, 0.3, 123.6, 1.1],
    kabKotaList: [
      "Kab. Boalemo",
      "Kab. Pohuwato",
      "Kab. Gorontalo Utara",
      "Kab. Bone Bolango",
      "Kab. Gorontalo",
      "Kota Gorontalo",
    ],
  },
  {
    id: "76",
    name: "Sulawesi Barat",
    islandGroup: "Sulawesi",
    baseRisk: 83,
    prevalence: 35.0,
    centroid: [119.23, -2.45],
    bbox: [118.7, -3.6, 119.9, -0.8],
    kabKotaList: [
      "Kab. Polewali Mandar",
      "Kab. Majene",
      "Kab. Mamasa",
      "Kab. Mamuju",
      "Kab. Mamuju Tengah",
      "Kab. Pasangkayu",
    ],
  },
  {
    id: "81",
    name: "Maluku",
    islandGroup: "Maluku & Papua",
    baseRisk: 63,
    prevalence: 26.1,
    centroid: [129.5, -4.2],
    bbox: [125.7, -8.3, 134.9, -2.7],
    kabKotaList: [
      "Kab. Maluku Barat Daya",
      "Kab. Kepulauan Tanimbar",
      "Kab. Kepulauan Aru",
      "Kab. Seram Bagian Barat",
      "Kab. Seram Bagian Timur",
      "Kab. Maluku Tengah",
      "Kab. Maluku Tenggara",
      "Kab. Buru Selatan",
      "Kab. Buru",
      "Kota Tual",
      "Kota Ambon",
    ],
  },
  {
    id: "82",
    name: "Maluku Utara",
    islandGroup: "Maluku & Papua",
    baseRisk: 61,
    prevalence: 26.1,
    centroid: [127.8, 0.78],
    bbox: [124.2, -2.5, 129.7, 2.7],
    kabKotaList: [
      "Kab. Pulau Taliabu",
      "Kab. Kepulauan Sula",
      "Kab. Halmahera Selatan",
      "Kab. Halmahera Timur",
      "Kab. Halmahera Tengah",
      "Kab. Halmahera Barat",
      "Kab. Halmahera Utara",
      "Kab. Pulau Morotai",
      "Kota Tidore Kepulauan",
      "Kota Ternate",
    ],
  },
  {
    id: "91",
    name: "Papua",
    islandGroup: "Maluku & Papua",
    baseRisk: 72,
    prevalence: 28.6,
    centroid: [138.8, -2.5],
    bbox: [134.8, -3.8, 141.0, -1.3],
    kabKotaList: [
      "Kab. Supiori",
      "Kab. Waropen",
      "Kab. Mamberamo Raya",
      "Kab. Kepulauan Yapen",
      "Kab. Biak Numfor",
      "Kab. Sarmi",
      "Kab. Keerom",
      "Kab. Jayapura",
      "Kota Jayapura",
    ],
  },
  {
    id: "92",
    name: "Papua Barat",
    islandGroup: "Maluku & Papua",
    baseRisk: 78,
    prevalence: 30.0,
    centroid: [133.5, -2.1],
    bbox: [131.5, -4.3, 135.0, -0.5],
    kabKotaList: [
      "Kab. Pegunungan Arfak",
      "Kab. Manokwari Selatan",
      "Kab. Teluk Wondama",
      "Kab. Teluk Bintuni",
      "Kab. Fakfak",
      "Kab. Kaimana",
      "Kab. Manokwari",
    ],
  },
  {
    id: "93",
    name: "Papua Selatan",
    islandGroup: "Maluku & Papua",
    baseRisk: 79,
    prevalence: 31.2,
    centroid: [139.6, -6.8],
    bbox: [137.5, -8.5, 141.0, -5.0],
    kabKotaList: [
      "Kab. Asmat",
      "Kab. Mappi",
      "Kab. Boven Digoel",
      "Kab. Merauke",
    ],
  },
  {
    id: "94",
    name: "Papua Tengah",
    islandGroup: "Maluku & Papua",
    baseRisk: 84,
    prevalence: 34.5,
    centroid: [136.5, -3.9],
    bbox: [134.8, -5.1, 138.2, -2.8],
    kabKotaList: [
      "Kab. Intan Jaya",
      "Kab. Puncak",
      "Kab. Puncak Jaya",
      "Kab. Dogiyai",
      "Kab. Deiyai",
      "Kab. Paniai",
      "Kab. Nabire",
      "Kab. Mimika",
    ],
  },
  {
    id: "95",
    name: "Papua Pegunungan",
    islandGroup: "Maluku & Papua",
    baseRisk: 87,
    prevalence: 34.8,
    centroid: [139.3, -4.3],
    bbox: [137.8, -5.2, 141.0, -3.4],
    kabKotaList: [
      "Kab. Nduga",
      "Kab. Lanny Jaya",
      "Kab. Mamberamo Tengah",
      "Kab. Yalimo",
      "Kab. Tolikara",
      "Kab. Yahukimo",
      "Kab. Pegunungan Bintang",
      "Kab. Jayawijaya",
    ],
  },
  {
    id: "96",
    name: "Papua Barat Daya",
    islandGroup: "Maluku & Papua",
    baseRisk: 75,
    prevalence: 29.8,
    centroid: [131.6, -1.2],
    bbox: [129.8, -2.3, 133.2, 0.2],
    kabKotaList: [
      "Kab. Tambrauw",
      "Kab. Maybrat",
      "Kab. Sorong Selatan",
      "Kab. Raja Ampat",
      "Kab. Sorong",
      "Kota Sorong",
    ],
  },
];

interface IndicatorMeta {
  id: IndicatorId;
  label: { id: string; en: string };
  unit: string;
  nationalAvg: number;
  minVal: number;
  maxVal: number;
  higherIsWorse: boolean;
  description: { id: string; en: string };
  impactMechanism: { id: string; en: string };
  recommendation: {
    title: { id: string; en: string };
    action: { id: string; en: string };
    sector: { id: string; en: string };
  };
}

const INDICATORS: IndicatorMeta[] = [
  {
    id: "sanitation_access",
    label: {
      id: "Akses Sanitasi Layak",
      en: "Improved Sanitation Access",
    },
    unit: "%",
    nationalAvg: 81.0,
    minVal: 32.0,
    maxVal: 98.5,
    higherIsWorse: false,
    description: {
      id: "Persentase rumah tangga yang memiliki akses terhadap fasilitas sanitasi layak dan aman.",
      en: "Percentage of households with access to improved and safely managed sanitation facilities.",
    },
    impactMechanism: {
      id: "Sanitasi buruk memicu infeksi berulang seperti diare dan Environmental Enteric Dysfunction (EED) yang menghambat penyerapan nutrisi pada usus balita.",
      en: "Poor sanitation triggers recurrent diarrheal infections and Environmental Enteric Dysfunction (EED), impairing gut nutrient absorption in toddlers.",
    },
    recommendation: {
      title: {
        id: "Akselerasi Sanitasi Total Berbasis Masyarakat (STBM) & Stop BABS",
        en: "Accelerate Community-Led Total Sanitation (STBM) & Open Defecation Free",
      },
      action: {
        id: "Pembangunan tangki septik komunal dan intervensi STBM di desa lokus prioritas dengan kepemilikan jamban sehat di bawah 65%.",
        en: "Deploy communal septic systems and STBM behavioral interventions in priority villages with latrine coverage below 65%.",
      },
      sector: {
        id: "PUPR & Dinas Kesehatan",
        en: "Public Works & Health Office",
      },
    },
  },
  {
    id: "clean_water_access",
    label: {
      id: "Akses Air Minum Layak",
      en: "Clean Drinking Water Access",
    },
    unit: "%",
    nationalAvg: 89.2,
    minVal: 45.0,
    maxVal: 99.4,
    higherIsWorse: false,
    description: {
      id: "Persentase rumah tangga yang menggunakan sumber air minum terlindung dan bebas kontaminasi E. coli.",
      en: "Percentage of households using protected drinking water sources free from E. coli contamination.",
    },
    impactMechanism: {
      id: "Paparan air terkontaminasi patogen selama 1.000 Hari Pertama Kehidupan (HPK) mengalihkan energi metabolisme pertumbuhan linier untuk melawan infeksi.",
      en: "Pathogen-contaminated water during the first 1,000 days diverts metabolic energy away from linear skeletal growth toward fighting chronic infection.",
    },
    recommendation: {
      title: {
        id: "Perluasan Jaringan SPAM Desa & Pengawasan Kualitas Air Rumah Tangga",
        en: "Expand Rural Piped Water (SPAM) & Household Water Quality Surveillance",
      },
      action: {
        id: "Instalasi jaringan Pamsimas dan uji berkala bakteriologis E. coli pada sumber air rumah tangga keluarga berisiko stunting.",
        en: "Install rural piped water systems and conduct routine E. coli bacteriological testing for at-risk households.",
      },
      sector: {
        id: "PUPR & Bappeda",
        en: "Public Works & Regional Planning",
      },
    },
  },
  {
    id: "poverty_rate",
    label: {
      id: "Tingkat Kemiskinan",
      en: "Poverty Rate",
    },
    unit: "%",
    nationalAvg: 9.36,
    minVal: 2.5,
    maxVal: 34.0,
    higherIsWorse: true,
    description: {
      id: "Persentase penduduk yang berada di bawah Garis Kemiskinan daerah.",
      en: "Percentage of population living below the regional poverty line.",
    },
    impactMechanism: {
      id: "Keterbatasan daya beli rumah tangga menurunkan kemampuan memperoleh pangan hewani berkualitas tinggi serta layanan kesehatan preventif.",
      en: "Constrained household purchasing power restricts access to nutrient-dense animal-source foods and preventive maternal-child healthcare.",
    },
    recommendation: {
      title: {
        id: "Integrasi Bantuan Sosial Pangan Berbasis Protein Hewani (PKH/BPNT)",
        en: "Integrate Animal-Protein Social Assistance Transfers (PKH/BPNT)",
      },
      action: {
        id: "Penajaman sasaran keluarga miskin ekstrem dengan ibu hamil dan baduta agar menerima paket telur, ikan, dan pangan fortifikasi.",
        en: "Prioritize extreme-poverty households with pregnant mothers and children under two for subsidized eggs, fish, and fortified foods.",
      },
      sector: {
        id: "Dinas Sosial & Ketahanan Pangan",
        en: "Social Affairs & Food Security",
      },
    },
  },
  {
    id: "exclusive_breastfeeding",
    label: {
      id: "Cakupan ASI Eksklusif",
      en: "Exclusive Breastfeeding Coverage",
    },
    unit: "%",
    nationalAvg: 67.9,
    minVal: 35.0,
    maxVal: 88.0,
    higherIsWorse: false,
    description: {
      id: "Persentase bayi usia 0–5 bulan yang hanya menerima ASI tanpa tambahan makanan/minuman lain.",
      en: "Percentage of infants aged 0–5 months receiving only breast milk without other foods or liquids.",
    },
    impactMechanism: {
      id: "ASI eksklusif memberikan antibodi imunoglobulin dan nutrisi optimal yang melindungi bayi dari infeksi saluran cerna dini.",
      en: "Exclusive breastfeeding delivers essential immunoglobulins and complete bioavailable nutrients that protect against early enteric infections.",
    },
    recommendation: {
      title: {
        id: "Penguatan Konselor Menyusui di Posyandu & Puskesmas",
        en: "Strengthen Lactation Counseling at Posyandu & Primary Clinics",
      },
      action: {
        id: "Pelatihan kader pendamping keluarga (TPK) untuk kunjungan rumah pascapersalinan dan inisiasi menyusu dini (IMD).",
        en: "Train family accompaniment cadres (TPK) for postpartum home visits and early initiation of breastfeeding.",
      },
      sector: {
        id: "Dinas Kesehatan & BKKBN",
        en: "Health Office & Family Planning Agency",
      },
    },
  },
  {
    id: "maternal_anemia",
    label: {
      id: "Prevalensi Anemia Ibu Hamil",
      en: "Maternal Anemia Prevalence",
    },
    unit: "%",
    nationalAvg: 27.7,
    minVal: 12.0,
    maxVal: 52.0,
    higherIsWorse: true,
    description: {
      id: "Persentase ibu hamil dengan kadar hemoglobin (Hb) kurang dari 11,0 g/dL.",
      en: "Percentage of pregnant women with hemoglobin (Hb) concentration below 11.0 g/dL.",
    },
    impactMechanism: {
      id: "Anemia defisiensi besi saat kehamilan menghambat suplai oksigen plasenta, meningkatkan risiko pertumbuhan janin terhambat (IUGR) dan BBLR.",
      en: "Iron-deficiency anemia during pregnancy restricts placental oxygen transport, elevating Intrauterine Growth Restriction (IUGR) and low birth weight.",
    },
    recommendation: {
      title: {
        id: "Kepatuhan Konsumsi Tablet Tambah Darah (TTD) & Skrining Hb Remaja Putri",
        en: "Enforce Iron-Folic Acid (TTD) Adherence & Adolescent Hb Screening",
      },
      action: {
        id: "Pemantauan aktif konsumsi minimal 90 tablet TTD pada ibu hamil dan pemberian TTD mingguan di sekolah menengah.",
        en: "Actively track 90+ tablet adherence among pregnant mothers and weekly iron supplementation in secondary schools.",
      },
      sector: {
        id: "Dinas Kesehatan & Dinas Pendidikan",
        en: "Health & Education Offices",
      },
    },
  },
  {
    id: "antenatal_care",
    label: {
      id: "Kunjungan Antenatal Lengkap (ANC K6)",
      en: "Complete Antenatal Care (ANC K6)",
    },
    unit: "%",
    nationalAvg: 74.5,
    minVal: 38.0,
    maxVal: 96.0,
    higherIsWorse: false,
    description: {
      id: "Persentase ibu hamil yang memperoleh layanan pemeriksaan kehamilan minimal 6 kali termasuk USG oleh dokter.",
      en: "Percentage of pregnant women receiving at least 6 antenatal checkups including ultrasound screening.",
    },
    impactMechanism: {
      id: "Pemeriksaan ANC K6 mendeteksi secara dini Kurang Energi Kronis (KEK) ibu hamil dan komplikasi pertumbuhan janin sebelum lahir.",
      en: "Complete ANC K6 visits enable early detection of maternal Chronic Energy Deficiency (CED) and fetal growth faltering before birth.",
    },
    recommendation: {
      title: {
        id: "Layanan ANC Terpadu &jemput Bola Ibu Hamil di Wilayah Terpencil",
        en: "Mobile Integrated ANC & Ultrasound Outreach in Remote Subdistricts",
      },
      action: {
        id: "Optimalisasi USG dasar di seluruh Puskesmas dan penjadwalan bidan desa untuk pelacakan ibu hamil KEK.",
        en: "Equip all community health centers with basic obstetric ultrasound and deploy village midwives to track CED mothers.",
      },
      sector: {
        id: "Dinas Kesehatan",
        en: "Regional Health Office",
      },
    },
  },
  {
    id: "basic_immunization",
    label: {
      id: "Imunisasi Dasar Lengkap (IDL)",
      en: "Complete Basic Immunization",
    },
    unit: "%",
    nationalAvg: 83.4,
    minVal: 42.0,
    maxVal: 98.0,
    higherIsWorse: false,
    description: {
      id: "Persentase anak usia 12–23 bulan yang telah menerima seluruh vaksin imunisasi dasar sesuai jadwal nasional.",
      en: "Percentage of children aged 12–23 months who received all scheduled basic immunizations.",
    },
    impactMechanism: {
      id: "Anak tanpa imunisasi lengkap rentan mengalami penyakit infeksi berat (campak, pneumonia, rotavirus) yang memicu penurunan berat badan akut dan gagal tumbuh.",
      en: "Unimmunized children face severe vaccine-preventable infections (measles, pneumonia, rotavirus) that trigger acute weight loss and growth faltering.",
    },
    recommendation: {
      title: {
        id: "Kejar Imunisasi & Sweeping Posyandu Berbasis By-Name By-Address",
        en: "Catch-Up Immunization & Posyandu Cohort Sweeping",
      },
      action: {
        id: "Integrasi pengingat jadwal imunisasi digital bagi orang tua dan layanan sweeping imunisasi pintu ke pintu.",
        en: "Deploy digital immunization reminders and door-to-door catch-up vaccination sweeps in low-coverage villages.",
      },
      sector: {
        id: "Dinas Kesehatan & Pemerintah Desa",
        en: "Health Office & Village Administration",
      },
    },
  },
  {
    id: "low_birth_weight",
    label: {
      id: "Prevalensi Berat Badan Lahir Rendah (BBLR)",
      en: "Low Birth Weight (LBW) Prevalence",
    },
    unit: "%",
    nationalAvg: 6.1,
    minVal: 2.8,
    maxVal: 14.5,
    higherIsWorse: true,
    description: {
      id: "Persentase bayi baru lahir dengan berat badan kurang dari 2.500 gram.",
      en: "Percentage of live births weighing less than 2,500 grams.",
    },
    impactMechanism: {
      id: "Bayi BBLR memulai kehidupan dengan cadangan nutrisi rendah dan memiliki risiko 2,5 hingga 3,5 kali lebih tinggi mengalami stunting pada usia 2 tahun.",
      en: "Low-birth-weight infants start life with depleted nutrient stores and carry a 2.5x to 3.5x higher risk of stunting by age two.",
    },
    recommendation: {
      title: {
        id: "Pemberian Makanan Tambahan (PMT) Lokal bagi Ibu Hamil KEK",
        en: "Local Supplementary Feeding (PMT) for Undernourished Pregnant Mothers",
      },
      action: {
        id: "Pemberian PMT berbahan pangan lokal padat gizi selama minimal 90 hari bagi ibu hamil dengan Lingkar Lengan Atas (LiLA) < 23,5 cm.",
        en: "Provide 90+ days of nutrient-dense local supplementary food to pregnant women with Mid-Upper Arm Circumference (MUAC) < 23.5 cm.",
      },
      sector: {
        id: "Dinas Kesehatan & TP-PKK",
        en: "Health Office & Family Welfare Movement",
      },
    },
  },
  {
    id: "dietary_diversity",
    label: {
      id: "Keragaman Pangan MP-ASI (Minimum Dietary Diversity)",
      en: "Minimum Dietary Diversity (MDD 6–23m)",
    },
    unit: "%",
    nationalAvg: 58.5,
    minVal: 25.0,
    maxVal: 86.0,
    higherIsWorse: false,
    description: {
      id: "Persentase anak usia 6–23 bulan yang mengonsumsi minimal 5 dari 8 kelompok pangan termasuk protein hewani.",
      en: "Percentage of children aged 6–23 months consuming at least 5 of 8 food groups daily, including animal-source protein.",
    },
    impactMechanism: {
      id: "Kekurangan asam amino esensial dan mikronutrien (zinc, zat besi, kalsium) dari protein hewani saat periode MP-ASI secara langsung menghambat pertumbuhan tulang panjang.",
      en: "Deficiencies in essential amino acids and micronutrients (zinc, iron, calcium) from animal proteins during complementary feeding directly stunt bone elongation.",
    },
    recommendation: {
      title: {
        id: "Kampanye 'Protein Hewani Setiap Hari' & Dapur Sehat Atasi Stunting (DASHAT)",
        en: "Daily Animal Protein Campaign & Community Nutrition Kitchens (DASHAT)",
      },
      action: {
        id: "Edukasi pengolahan MP-ASI kaya protein hewani lokal (ikan, telur, hati ayam) di Kampung KB dan Posyandu.",
        en: "Run hands-on MP-ASI cooking demonstrations featuring local fish, eggs, and chicken liver across all Posyandu posts.",
      },
      sector: {
        id: "BKKBN, Dinas Perikanan & Dinas Kesehatan",
        en: "Family Planning, Fisheries & Health",
      },
    },
  },
  {
    id: "mothers_education",
    label: {
      id: "Rata-rata Lama Sekolah Perempuan / Pendidikan Ibu",
      en: "Maternal Secondary Education Completion",
    },
    unit: "%",
    nationalAvg: 64.2,
    minVal: 28.0,
    maxVal: 92.0,
    higherIsWorse: false,
    description: {
      id: "Persentase ibu usia reproduktif yang menamatkan pendidikan minimal jenjang menengah atas (SMA/sederajat).",
      en: "Percentage of mothers of reproductive age who completed at least upper-secondary education.",
    },
    impactMechanism: {
      id: "Tingkat literasi kesehatan ibu menentukan ketepatan praktik pemberian makan bayi, higienitas rumah tangga, dan kecepatan mencari layanan medis.",
      en: "Maternal health literacy strongly governs infant feeding practices, household hygiene habits, and timely care-seeking behavior.",
    },
    recommendation: {
      title: {
        id: "Kelas Ibu Balita & Edukasi Pengasuhan 1.000 HPK",
        en: "Mother-Toddler Parenting Classes & 1,000-Day Nutrition Literacy",
      },
      action: {
        id: "Pelaksanaan Kelas Ibu Balita bulanan menggunakan modul visual bahasa daerah bagi keluarga dengan tingkat pendidikan rendah.",
        en: "Conduct monthly visual-first Mother-Toddler classes in local dialects tailored to low-literacy households.",
      },
      sector: {
        id: "Dinas PPPA & Dinas Kesehatan",
        en: "Women Empowerment & Health Office",
      },
    },
  },
  {
    id: "early_marriage",
    label: {
      id: "Angka Perkawinan Usia Anak",
      en: "Child & Early Marriage Rate",
    },
    unit: "%",
    nationalAvg: 8.1,
    minVal: 1.5,
    maxVal: 21.0,
    higherIsWorse: true,
    description: {
      id: "Persentase perempuan usia 20–24 tahun yang menikah sebelum usia 18 tahun.",
      en: "Percentage of women aged 20–24 who were married before reaching age 18.",
    },
    impactMechanism: {
      id: "Kehamilan pada usia remaja menyebabkan kompetisi nutrisi antara tubuh ibu yang masih tumbuh dengan janin yang dikandungnya.",
      en: "Adolescent pregnancy creates biological nutrient competition between the still-growing mother and the developing fetus.",
    },
    recommendation: {
      title: {
        id: "Pencegahan Perkawinan Anak & Pendampingan Calon Pengantin (Elsimil)",
        en: "Prevent Early Marriage & Mandatory Pre-Marital Health Screening (Elsimil)",
      },
      action: {
        id: "Pengetatan dispensasi kawin, edukasi kesehatan reproduksi remaja, dan skrining gizi calon pengantin 3 bulan sebelum menikah.",
        en: "Enforce pre-marital nutritional screening 3 months prior to marriage and expand adolescent reproductive health programs.",
      },
      sector: {
        id: "BKKBN, Kemenag & Dinas PPPA",
        en: "BKKBN, Religious Affairs & Women Protection",
      },
    },
  },
  {
    id: "food_insecurity",
    label: {
      id: "Prevalensi Ketidakcukupan Konsumsi Pangan (PoU)",
      en: "Food Insecurity Prevalence (PoU)",
    },
    unit: "%",
    nationalAvg: 8.5,
    minVal: 2.0,
    maxVal: 29.0,
    higherIsWorse: true,
    description: {
      id: "Persentase penduduk yang mengonsumsi kalori dan zat gizi di bawah kebutuhan minimum untuk hidup sehat.",
      en: "Percentage of population consuming dietary energy and nutrients below minimum requirements for active health.",
    },
    impactMechanism: {
      id: "Kerawanan pangan kronis di tingkat rumah tangga menyebabkan defisit energi-protein jangka panjang pada balita dan ibu menyusui.",
      en: "Chronic household food insecurity causes sustained protein-energy deficits in both nursing mothers and young children.",
    },
    recommendation: {
      title: {
        id: "Optimalisasi Pekarangan Pangan Lestari (P2L) & Cadangan Pangan Desa",
        en: "Sustainable Homestead Food Gardens (P2L) & Village Food Reserves",
      },
      action: {
        id: "Pengembangan kebun gizi desa dan budidaya ikan dalam ember (Budikdamber) bagi rumah tangga rentan pangan.",
        en: "Establish village nutrition gardens and household aquaculture systems for food-insecure families.",
      },
      sector: {
        id: "Dinas Ketahanan Pangan & Pertanian",
        en: "Food Security & Agriculture Office",
      },
    },
  },
];

// Helper to build a realistic organic polygon around a center box so maps look crisp & geographic
function createOrganicPolygon(
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number,
  rand: () => number,
  numVertices = 14
): number[][][] {
  const cx = (minLon + maxLon) / 2;
  const cy = (minLat + maxLat) / 2;
  const rx = ((maxLon - minLon) / 2) * 0.88;
  const ry = ((maxLat - minLat) / 2) * 0.88;

  const ring: number[][] = [];
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const jitter = 0.78 + rand() * 0.34;
    const lon = Number((cx + Math.cos(angle) * rx * jitter).toFixed(4));
    const lat = Number((cy + Math.sin(angle) * ry * jitter).toFixed(4));
    ring.push([lon, lat]);
  }
  ring.push([...ring[0]]);
  return [ring];
}

// Helper to generate grid-like tessellated organic polygons for Kab/Kota within a province bbox
function createProvinceKabKotaGridPolygons(
  bbox: [number, number, number, number],
  count: number,
  rand: () => number
): number[][][][] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const cols = Math.ceil(Math.sqrt(count * 1.35));
  const rows = Math.ceil(count / cols);
  const cellW = (maxLon - minLon) / cols;
  const cellH = (maxLat - minLat) / rows;

  const polygons: number[][][][] = [];
  for (let idx = 0; idx < count; idx++) {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const cMinLon = minLon + c * cellW + cellW * 0.04;
    const cMaxLon = minLon + (c + 1) * cellW - cellW * 0.04;
    const cMinLat = minLat + r * cellH + cellH * 0.04;
    const cMaxLat = minLat + (r + 1) * cellH - cellH * 0.04;

    polygons.push(
      createOrganicPolygon(cMinLon, cMinLat, cMaxLon, cMaxLat, rand, 10)
    );
  }
  return polygons;
}

// Convert a list of GeoJSON Polygon features into a valid uncompressed TopoJSON Topology
function featuresToTopoJSON(
  objectName: string,
  features: Array<{
    id: string;
    properties: Record<string, unknown>;
    coordinates: number[][][];
  }>
) {
  const arcs: number[][][] = [];
  const geometries = features.map((f, idx) => {
    arcs.push(f.coordinates[0]);
    return {
      type: "Polygon",
      id: f.id,
      properties: f.properties,
      arcs: [[idx]],
    };
  });

  return {
    type: "Topology",
    objects: {
      [objectName]: {
        type: "GeometryCollection",
        geometries,
      },
    },
    arcs,
  };
}

function main() {
  const rand = createSeededRandom(20261017);

  const rootDir = process.cwd();
  const mocksDir = path.join(rootDir, "mocks");
  const kabKotaMocksDir = path.join(mocksDir, "kabkota");
  const explanationsMocksDir = path.join(mocksDir, "explanations");
  const geoDir = path.join(rootDir, "public", "geo");
  const kabKotaGeoDir = path.join(geoDir, "kabkota");

  for (const dir of [
    mocksDir,
    kabKotaMocksDir,
    explanationsMocksDir,
    geoDir,
    kabKotaGeoDir,
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 1. Sort provinces by baseRisk desc to assign nationalRank 1..38
  const sortedProvDefs = [...PROVINCE_DEFS].sort(
    (a, b) => b.baseRisk - a.baseRisk
  );
  const rankMap = new Map<string, number>();
  sortedProvDefs.forEach((p, i) => rankMap.set(p.id, i + 1));

  // First pass: generate all Kab/Kota across all 38 provinces so we can compute global nationalRank (1..N)
  interface PendingKabKota {
    id: string;
    provinceId: string;
    provinceName: string;
    name: string;
    type: RegionType;
    riskIndex: number;
    factors: RiskFactor[];
    recommendations: RecommendationItem[];
  }

  const allPendingKabKota: PendingKabKota[] = [];

  for (const prov of PROVINCE_DEFS) {
    const count = prov.kabKotaList.length;
    prov.kabKotaList.forEach((kabName, idx) => {
      const kabId = `${prov.id}${String(idx + 1).padStart(2, "0")}`;
      const isKota = kabName.startsWith("Kota");
      const type: RegionType = isKota ? "Kota" : "Kabupaten";

      // Kota generally has slightly lower risk than rural Kabupaten
      const offset = isKota
        ? -Math.round(6 + rand() * 14)
        : Math.round((rand() - 0.42) * 26);
      const rawScore = Math.max(8, Math.min(96, prov.baseRisk + offset));

      // Generate the 12 indicator factors for this Kab/Kota
      const severityRatio = rawScore / 100; // 0 = best, 1 = worst
      const factors: RiskFactor[] = INDICATORS.map((meta) => {
        const provSeverity = prov.baseRisk / 100;
        const span = meta.maxVal - meta.minVal;

        // Calculate province average
        const provRaw = meta.higherIsWorse
          ? meta.minVal + span * (provSeverity * 0.75 + 0.1)
          : meta.maxVal - span * (provSeverity * 0.75 + 0.1);
        const provinceAvg = Number(provRaw.toFixed(1));

        // Calculate regional value with deterministic local noise
        const localNoise = (rand() - 0.5) * 0.28;
        const effectiveSeverity = Math.max(
          0.02,
          Math.min(0.98, severityRatio + localNoise)
        );
        const regRaw = meta.higherIsWorse
          ? meta.minVal + span * effectiveSeverity
          : meta.maxVal - span * effectiveSeverity;
        const value = Number(regRaw.toFixed(1));

        // Compute normalized SHAP-like contribution (-0.85 to +0.85)
        const diffFromNat = meta.higherIsWorse
          ? (value - meta.nationalAvg) / (span * 0.5)
          : (meta.nationalAvg - value) / (span * 0.5);
        const contribution = Number(
          Math.max(-0.92, Math.min(0.92, diffFromNat)).toFixed(2)
        );

        let status: "worse" | "better" | "neutral" = "neutral";
        if (contribution > 0.06) status = "worse";
        else if (contribution < -0.06) status = "better";

        return {
          id: meta.id,
          label: meta.label,
          value,
          unit: meta.unit,
          provinceAvg,
          nationalAvg: meta.nationalAvg,
          contribution,
          higherIsWorse: meta.higherIsWorse,
          status,
          description: meta.description,
          impactMechanism: meta.impactMechanism,
        };
      });

      // Sort factors by absolute contribution descending
      factors.sort(
        (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
      );

      // Build top 4 recommendations from the highest positive risk-driving factors
      const riskDrivers = [...factors].sort(
        (a, b) => b.contribution - a.contribution
      );
      const recommendations: RecommendationItem[] = riskDrivers
        .slice(0, 4)
        .map((driver, rIdx) => {
          const meta = INDICATORS.find((m) => m.id === driver.id)!;
          return {
            id: `${kabId}-rec-${rIdx + 1}`,
            priority: (rIdx + 1) as 1 | 2 | 3 | 4,
            targetFactorId: driver.id,
            title: meta.recommendation.title,
            action: meta.recommendation.action,
            sector: meta.recommendation.sector,
          };
        });

      allPendingKabKota.push({
        id: kabId,
        provinceId: prov.id,
        provinceName: prov.name,
        name: kabName,
        type,
        riskIndex: rawScore,
        factors,
        recommendations,
      });
    });
  }

  // Compute global national ranks across all 514 Kab/Kota
  const totalNational = allPendingKabKota.length;
  const sortedNational = [...allPendingKabKota].sort(
    (a, b) => b.riskIndex - a.riskIndex || a.id.localeCompare(b.id)
  );
  const natRankByKabId = new Map<string, number>();
  sortedNational.forEach((k, idx) => natRankByKabId.set(k.id, idx + 1));

  const provincesOutput: Province[] = [];
  const provinceGeoFeatures: Array<{
    id: string;
    properties: Record<string, unknown>;
    coordinates: number[][][];
  }> = [];

  for (const prov of PROVINCE_DEFS) {
    const provKabPending = allPendingKabKota
      .filter((k) => k.provinceId === prov.id)
      .sort((a, b) => b.riskIndex - a.riskIndex || a.id.localeCompare(b.id));

    const totalInProvince = provKabPending.length;
    const highRiskCount = provKabPending.filter(
      (k) => k.riskIndex >= 50
    ).length;

    const provinceRecord: Province = {
      id: prov.id,
      name: prov.name,
      islandGroup: prov.islandGroup,
      riskIndex: prov.baseRisk,
      riskLevel: getRiskLevelFromScore(prov.baseRisk),
      nationalRank: rankMap.get(prov.id)!,
      totalKabKota: totalInProvince,
      highRiskKabKotaCount: highRiskCount,
      stuntingPrevalenceEst: prov.prevalence,
      centroid: prov.centroid,
    };
    provincesOutput.push(provinceRecord);

    // Build Province TopoJSON feature
    const [minLon, minLat, maxLon, maxLat] = prov.bbox;
    provinceGeoFeatures.push({
      id: prov.id,
      properties: {
        id: prov.id,
        name: prov.name,
        islandGroup: prov.islandGroup,
      },
      coordinates: createOrganicPolygon(
        minLon,
        minLat,
        maxLon,
        maxLat,
        rand,
        16
      ),
    });

    // Build KabKota JSON & Explanation JSON for this province
    const kabKotaListOutput: KabKota[] = [];
    const kabPolygons = createProvinceKabKotaGridPolygons(
      prov.bbox,
      totalInProvince,
      rand
    );
    const kabGeoFeatures: Array<{
      id: string;
      properties: Record<string, unknown>;
      coordinates: number[][][];
    }> = [];

    provKabPending.forEach((item, pIdx) => {
      const provinceRank = pIdx + 1;
      const nationalRank = natRankByKabId.get(item.id)!;
      const riskLevel = getRiskLevelFromScore(item.riskIndex);

      const topRiskDrivers = [...item.factors].sort(
        (a, b) => b.contribution - a.contribution
      );
      const topProtective = [...item.factors].sort(
        (a, b) => a.contribution - b.contribution
      );

      const driver1 = topRiskDrivers[0];
      const driver2 = topRiskDrivers[1];
      const protect1 = topProtective[0];

      const kabRecord: KabKota = {
        id: item.id,
        provinceId: prov.id,
        provinceName: prov.name,
        name: item.name,
        type: item.type,
        riskIndex: item.riskIndex,
        riskLevel,
        provinceRank,
        totalInProvince,
        nationalRank,
        totalNational,
        topDriverLabel: driver1.label,
      };
      kabKotaListOutput.push(kabRecord);

      const riskLabelId =
        riskLevel === "very_high"
          ? "sangat tinggi"
          : riskLevel === "high"
          ? "tinggi"
          : riskLevel === "moderate"
          ? "sedang"
          : "rendah";
      const riskLabelEn =
        riskLevel === "very_high"
          ? "very high"
          : riskLevel === "high"
          ? "high"
          : riskLevel === "moderate"
          ? "moderate"
          : "low";

      const explanation: ExplanationData = {
        kabKotaId: item.id,
        provinceId: prov.id,
        provinceName: prov.name,
        name: item.name,
        type: item.type,
        riskIndex: item.riskIndex,
        riskLevel,
        provinceRank,
        totalInProvince,
        nationalRank,
        totalNational,
        summary: {
          id: `${item.name} memiliki indeks risiko stunting ${item.riskIndex}/100 (kategori ${riskLabelId}), menempati peringkat #${provinceRank} dari ${totalInProvince} wilayah di ${prov.name}. Pendorong risiko utama di wilayah ini adalah ${driver1.label.id} (${driver1.value}${driver1.unit}) serta ${driver2.label.id} (${driver2.value}${driver2.unit}). Di sisi lain, capaian ${protect1.label.id} (${protect1.value}${protect1.unit}) berperan sebagai faktor pelindung yang menahan laju risiko lebih lanjut.`,
          en: `${item.name} records a stunting risk index of ${item.riskIndex}/100 (${riskLabelEn} risk), ranking #${provinceRank} out of ${totalInProvince} districts in ${prov.name}. The primary risk drivers are ${driver1.label.en} (${driver1.value}${driver1.unit}) and ${driver2.label.en} (${driver2.value}${driver2.unit}). Conversely, local performance in ${protect1.label.en} (${protect1.value}${protect1.unit}) acts as a protective buffer mitigating further risk escalation.`,
        },
        factors: item.factors,
        recommendations: item.recommendations,
        methodology: {
          dataYear: "2024/2025",
          source:
            "Simulasi Terpadu SSGI Kemenkes RI, Susenas BPS & Indeks Khusus Penanganan Stunting (IKPS)",
          modelVersion: "StuntWatch SHAP-Spatial v2.4",
          disclaimer: {
            id: "Indeks Risiko StuntWatch merupakan instrumen pendukung keputusan perencanaan wilayah (decision-support) dan bukan alat diagnosis klinis individu. Nilai kontribusi faktor dihitung menggunakan dekomposisi aditif terhadap rata-rata nasional.",
            en: "The StuntWatch Risk Index is a regional planning decision-support instrument and not an individual clinical diagnostic tool. Factor contributions are derived via additive SHAP-style decomposition relative to national benchmarks.",
          },
        },
      };

      fs.writeFileSync(
        path.join(explanationsMocksDir, `${item.id}.json`),
        JSON.stringify(explanation, null, 2)
      );

      kabGeoFeatures.push({
        id: item.id,
        properties: {
          id: item.id,
          name: item.name,
          provinceId: prov.id,
          type: item.type,
        },
        coordinates: kabPolygons[pIdx],
      });
    });

    fs.writeFileSync(
      path.join(kabKotaMocksDir, `${prov.id}.json`),
      JSON.stringify(kabKotaListOutput, null, 2)
    );

    const kabTopo = featuresToTopoJSON("kabkota", kabGeoFeatures);
    fs.writeFileSync(
      path.join(kabKotaGeoDir, `${prov.id}.topojson`),
      JSON.stringify(kabTopo)
    );
  }

  // Sort provincesOutput by nationalRank ascending (1..38)
  provincesOutput.sort((a, b) => a.nationalRank - b.nationalRank);
  fs.writeFileSync(
    path.join(mocksDir, "provinces.json"),
    JSON.stringify(provincesOutput, null, 2)
  );

  const provTopo = featuresToTopoJSON("provinces", provinceGeoFeatures);
  fs.writeFileSync(
    path.join(geoDir, "provinces.topojson"),
    JSON.stringify(provTopo)
  );

  console.log(
    `Generated ${provincesOutput.length} provinces and ${totalNational} Kab/Kota mock & TopoJSON records.`
  );
}

main();
