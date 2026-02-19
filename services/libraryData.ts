import { LibraryResource } from "../types";

export const SYSTEM_RESOURCES: LibraryResource[] = [
  {
    id: "starter-workbook-001",
    title: "KingCompiler Starter Workbook",
    genre: "Chess",
    level: "Beginner",
    category: "Essential Guide",
    url: "https://kingcompiler.com/starter-workbook.pdf",
    coverImageUrl:
      "https://files.oaiusercontent.com/file-AzRj7V7S1Vq8pXm6mF6q6S",
    type: "pdf",
    addedDate: "2024-01-01T00:00:00Z",
    storageSource: "cloud",
  },
  {
    id: "kingcompiler-starterbook-local-001",
    title: "Kingcompiler Starterbook",
    genre: "Chess",
    level: "Beginner",
    category: "Local Upload",
    url: "/assets/library/chess/beginner/book1.pdf",
    coverImageUrl: "/assets/library/chess/beginner/book1.png",
    type: "pdf",
    addedDate: "2026-02-19T00:00:00Z",
    storageSource: "local",
    localAssetId: "assets/library/chess/beginner/book1.pdf",
  },
  {
    id: "winning-chess-puzzles-kids-001",
    title: "Winning Chess Puzzles for Kids",
    genre: "Chess",
    level: "Intermediate",
    category: "Puzzle Training",
    url: "/assets/library/chess/intermediate/book2.pdf",
    coverImageUrl: "/assets/library/chess/intermediate/book2.jpeg",
    type: "pdf",
    addedDate: "2026-02-19T00:00:00Z",
    storageSource: "local",
    localAssetId: "assets/library/chess/intermediate/book2.pdf",
  },
];
