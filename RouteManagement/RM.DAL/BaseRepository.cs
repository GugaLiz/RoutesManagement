using RM.Common;
using RM.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.DAL
{
    public abstract class BaseRepository<T>
    {
        protected IDatabase db;
        public BaseRepository(IDatabase db)
        {
            this.db = db;
        }

        public abstract Page<T> List(PageCondition cond);

        public abstract T Get(int id);

        public void Update(T item)
        {
            db.Update(item);
        }

        public void Add(T item)
        {
            db.Insert(item);
        }

        public int Delete(int id)
        {
            return db.Delete<T>(id);
        }

    }
}
