import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Megaphone, Mail, Scale, FileBarChart } from 'lucide-react';
import type { NewsItem } from '../../types';
import { formatDateToDDMMYYYY } from '../../utils/dateUtils';

interface InfoCardProps {
  article: NewsItem;
  image?: string;
}

const getCategoryConfig = (category: NewsItem['category']) => {
  switch (category) {
    case 'Publication':
      return {
        icon: FileText,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      };
    case 'Communiqué':
      return {
        icon: Megaphone,
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-200'
      };
    case 'Newsletter':
      return {
        icon: Mail,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      };
    case 'Journal Officiel':
      return {
        icon: Scale,
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-200'
      };
    case 'Rapport':
      return {
        icon: FileBarChart,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200'
      };
    case 'Rapport institutionnel':
      return {
        icon: FileBarChart,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200'
      };
    default:
      return {
        icon: FileText,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200'
      };
  }
};

const InfoCard: React.FC<InfoCardProps> = ({ article, image }) => {
  const categoryConfig = getCategoryConfig(article.category);
  const CategoryIcon = categoryConfig.icon;

  return (
    <article className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 flex flex-col relative">
      {image && (
        <div className="h-48 overflow-hidden">
          <img 
            src={image} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-3">
          <time className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {article.publishedAt && article.publishedAt.match(/^\d{2}\/\d{2}\/\d{4}$/) 
              ? article.publishedAt 
              : formatDateToDDMMYYYY(article.publishedAt)}
          </time>
        </div>
        <h3 className="text-lg font-semibold mb-3 text-gray-900">
          {article.title}
        </h3>
        <p className="text-gray-600 mb-4 text-sm flex-grow">
          {article.excerpt}
        </p>
        <div className="flex justify-end">
          <Link 
            to={article.contentType ? `/item?id=${article.id}&type=${article.contentType}` : `/article?id=${article.id}`}
            className="text-srh-blue hover:text-srh-blue-dark font-medium text-sm inline-flex items-center"
          >
            Lire plus
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
      
      {/* Category label at bottom left */}
      <div className={`absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${categoryConfig.bgColor} ${categoryConfig.textColor} ${categoryConfig.borderColor}`}>
        <CategoryIcon className="h-3 w-3" />
        <span>{article.category}</span>
      </div>
    </article>
  );
};

export default InfoCard;