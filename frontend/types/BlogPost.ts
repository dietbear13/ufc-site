// types/BlogPost.ts
export interface BlogPost {
    title: string;
    slug: string;
    date: string;
    author: string;
    excerpt?: string;
    contentHtml: string;
    image?: string;
}
