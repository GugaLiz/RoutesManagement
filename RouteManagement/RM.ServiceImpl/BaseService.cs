using RM.Common;
using RM.DAL;
using RM.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.ServiceImpl
{
    public interface IBaseService<T>
    {
        T Get(int id);
        Page<T> List(PageCondition cond);
        int Remove(int id);
        void Update(T item);
        void Add(T item);
    }

    public abstract class BaseService<T> : IBaseService<T>
    {
        protected BaseRepository<T> rep;
        protected IDatabase db;
        public BaseService(IDatabase db, BaseRepository<T> rep)
        {
            this.db = db;
            this.rep = rep;
        }

        public void Save(T item)
        {
            rep.Update(item);
        }

        public T Get(int id)
        {
            return rep.Get(id);
        }

        public Page<T> List(PageCondition cond)
        {
            return rep.List(cond);
        }

        public int Remove(int id)
        {
            return rep.Delete(id);

        }

        public void Add(T item)
        {
            rep.Add(item);
        }

        public void Update(T item)
        {
            rep.Update(item);
        }
    }
}
