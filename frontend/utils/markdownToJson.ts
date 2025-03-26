// utils/markdownToJson.ts
import fs from 'fs';
import matter from 'gray-matter';
import { marked } from 'marked';

interface FighterFrontMatter { name: string; slug: string; [key: string]: any }
interface EventFrontMatter { title: string; slug: string; [key: string]: any }
interface PostFrontMatter { title: string; slug: string; date: string; [key: string]: any }

// Функция для обработки всех Markdown-файлов в указанной директории
function parseMarkdownDir<T>(dir: string): T[] {
    return fs.readdirSync(dir).map(file => {
        const md = fs.readFileSync(`${dir}/${file}`, 'utf-8');
        const { data, content } = matter(md);
        // конвертируем Markdown-контент в HTML
        const html = marked(content);
        // объединяем фронтматтер и HTML-контент
        return { ...data, contentHtml: html } as T;
    });
}

// Генерируем большой JSON с данными бойцов, турниров и постов
export function generateContentData() {
    const fighters = parseMarkdownDir<FighterFrontMatter>('content/fighters');
    const events = parseMarkdownDir<EventFrontMatter>('content/events');
    const posts = parseMarkdownDir<PostFrontMatter>('content/blog');
    const data = { fighters, events, posts };
    // сохраняем в файл для последующего использования
    fs.writeFileSync('content/data.json', JSON.stringify(data, null, 2));
    return data;
}
